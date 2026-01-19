import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { v2 as cloudinary } from 'cloudinary';

// =====================
// DATABASE CONNECTION
// =====================
const connectionString = process.env.NEON_DATABASE_URL;
let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    if (!connectionString) {
      throw new Error('NEON_DATABASE_URL is not set');
    }
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

async function query(text: string, params?: any[]) {
  const client = await getPool().connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

// =====================
// CLOUDINARY CONFIG
// =====================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =====================
// AUTH CONFIG
// =====================
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'password';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change-me';

function generateAdminToken(payload: object) {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '8h' });
}

function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function checkAdmin(req: VercelRequest): boolean {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return false;
  const token = auth.split(' ')[1];
  const decoded = verifyAdminToken(token);
  return !!decoded;
}

// =====================
// EMAIL CONFIG
// =====================
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// =====================
// HELPERS
// =====================
const ARTICLE_SELECT = `
  a.id, a.title, a.slug, a.excerpt, a.content, a.featured_image, a.category_id, a.author_id,
  a.published_at, a.reading_time, a.views, a.is_featured, a.is_breaking, a.created_at, a.updated_at,
  json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'description', c.description) as categories,
  json_build_object('id', au.id, 'name', au.name, 'bio', au.bio, 'avatar_url', au.avatar_url) as authors
`;

function corsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}

// =====================
// MAIN API HANDLER
// =====================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  corsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const method = req.method || 'GET';
  
  try {
    // =====================
    // PUBLIC ENDPOINTS
    // =====================
    
    // GET /api/categories
    if (url.match(/^\/api\/categories\/?$/) && method === 'GET') {
      const result = await query('SELECT id, name, slug, description, created_at FROM categories ORDER BY name');
      return res.json(result.rows);
    }
    
    // GET /api/authors
    if (url.match(/^\/api\/authors\/?$/) && method === 'GET') {
      const result = await query('SELECT id, name, bio, avatar_url, created_at FROM authors ORDER BY name');
      return res.json(result.rows);
    }
    
    // GET /api/articles/slug/:slug
    const slugMatch = url.match(/^\/api\/articles\/slug\/([^/?]+)/);
    if (slugMatch && method === 'GET') {
      const slug = decodeURIComponent(slugMatch[1]);
      const q = `SELECT ${ARTICLE_SELECT} FROM articles a JOIN categories c ON a.category_id = c.id JOIN authors au ON a.author_id = au.id WHERE a.slug = $1 LIMIT 1`;
      const result = await query(q, [slug]);
      return res.json(result.rows[0] || null);
    }
    
    // POST /api/articles/:id/views
    const viewsMatch = url.match(/^\/api\/articles\/(\d+)\/views/);
    if (viewsMatch && method === 'POST') {
      const id = viewsMatch[1];
      const result = await query('UPDATE articles SET views = views + 1 WHERE id = $1 RETURNING views', [id]);
      return res.json(result.rows[0] || null);
    }
    
    // GET /api/articles/breaking
    if (url.match(/^\/api\/articles\/breaking/) && method === 'GET') {
      const limit = parseInt((req.query.limit as string) || '5', 10);
      const q = `SELECT ${ARTICLE_SELECT} FROM articles a JOIN categories c ON a.category_id = c.id JOIN authors au ON a.author_id = au.id WHERE a.is_breaking = true ORDER BY a.published_at DESC LIMIT $1`;
      const result = await query(q, [limit]);
      return res.json(result.rows);
    }
    
    // GET /api/articles/related
    if (url.match(/^\/api\/articles\/related/) && method === 'GET') {
      const { category_id, exclude_id, limit } = req.query;
      const lim = parseInt((limit as string) || '3', 10);
      const q = `SELECT ${ARTICLE_SELECT} FROM articles a JOIN categories c ON a.category_id = c.id JOIN authors au ON a.author_id = au.id WHERE a.category_id = $1 AND a.id <> $2 ORDER BY a.published_at DESC LIMIT $3`;
      const result = await query(q, [category_id, exclude_id, lim]);
      return res.json(result.rows);
    }
    
    // GET /api/articles
    if (url.match(/^\/api\/articles\/?(\?|$)/) && method === 'GET') {
      const { featured, trending, limit, category_id } = req.query;
      const lim = parseInt((limit as string) || '5', 10);
      let q = `SELECT ${ARTICLE_SELECT} FROM articles a JOIN categories c ON a.category_id = c.id JOIN authors au ON a.author_id = au.id`;
      const params: any[] = [];
      if (category_id) {
        params.push(category_id);
        q += ` WHERE a.category_id = $${params.length}`;
      }
      if (featured === 'true') {
        q += params.length ? ' AND a.is_featured = true' : ' WHERE a.is_featured = true';
      }
      if (trending === 'true') {
        q += ' ORDER BY a.views DESC';
      } else {
        q += ' ORDER BY a.published_at DESC';
      }
      q += ` LIMIT ${lim}`;
      const result = await query(q, params);
      return res.json(result.rows);
    }
    
    // GET /api/articles/:id/comments
    const commentsMatch = url.match(/^\/api\/articles\/(\d+)\/comments/);
    if (commentsMatch && method === 'GET') {
      const id = commentsMatch[1];
      const result = await query(
        `SELECT c.id, c.content, c.created_at, s.name as author_name 
         FROM comments c 
         JOIN subscribers s ON c.subscriber_id = s.id 
         WHERE c.article_id = $1 AND c.is_approved = true 
         ORDER BY c.created_at DESC`,
        [id]
      );
      return res.json(result.rows);
    }
    
    // POST /api/articles/:id/comments
    if (commentsMatch && method === 'POST') {
      const id = commentsMatch[1];
      const { email, content } = req.body || {};
      if (!email || !content) {
        return res.status(400).json({ error: 'Email and content are required' });
      }
      const subscriber = await query(
        'SELECT id FROM subscribers WHERE email = $1 AND unsubscribed_at IS NULL',
        [email.toLowerCase()]
      );
      if (subscriber.rows.length === 0) {
        return res.status(403).json({ error: 'You must be subscribed to comment. Please subscribe first.' });
      }
      const subscriberId = subscriber.rows[0].id;
      const result = await query(
        'INSERT INTO comments (article_id, subscriber_id, content, is_approved) VALUES ($1, $2, $3, $4) RETURNING id',
        [id, subscriberId, content.trim(), true]
      );
      return res.json({ message: 'Comment added successfully', id: result.rows[0].id });
    }
    
    // GET /api/articles/:id/likes
    const likesGetMatch = url.match(/^\/api\/articles\/(\d+)\/likes/);
    if (likesGetMatch && method === 'GET') {
      const id = likesGetMatch[1];
      const email = req.query.email as string | undefined;
      const countResult = await query('SELECT COUNT(*) as count FROM article_likes WHERE article_id = $1', [id]);
      const count = parseInt(countResult.rows[0].count, 10);
      let userLiked = false;
      if (email) {
        const likeCheck = await query(
          `SELECT 1 FROM article_likes al 
           JOIN subscribers s ON al.subscriber_id = s.id 
           WHERE al.article_id = $1 AND s.email = $2`,
          [id, email.toLowerCase()]
        );
        userLiked = likeCheck.rows.length > 0;
      }
      return res.json({ count, userLiked });
    }
    
    // POST /api/articles/:id/like
    const likePostMatch = url.match(/^\/api\/articles\/(\d+)\/like/);
    if (likePostMatch && method === 'POST') {
      const id = likePostMatch[1];
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'Email is required' });
      const subscriber = await query(
        'SELECT id FROM subscribers WHERE email = $1 AND unsubscribed_at IS NULL',
        [email.toLowerCase()]
      );
      if (subscriber.rows.length === 0) {
        return res.status(403).json({ error: 'You must be subscribed to like articles' });
      }
      const subscriberId = subscriber.rows[0].id;
      const existing = await query(
        'SELECT id FROM article_likes WHERE article_id = $1 AND subscriber_id = $2',
        [id, subscriberId]
      );
      if (existing.rows.length > 0) {
        await query('DELETE FROM article_likes WHERE id = $1', [existing.rows[0].id]);
        return res.json({ liked: false, message: 'Unliked' });
      } else {
        await query('INSERT INTO article_likes (article_id, subscriber_id) VALUES ($1, $2)', [id, subscriberId]);
        return res.json({ liked: true, message: 'Liked' });
      }
    }
    
    // POST /api/subscribe
    if (url.match(/^\/api\/subscribe\/?$/) && method === 'POST') {
      const { email, name } = req.body || {};
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email is required' });
      }
      const existing = await query('SELECT id, unsubscribed_at FROM subscribers WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        const subscriber = existing.rows[0];
        if (subscriber.unsubscribed_at) {
          await query('UPDATE subscribers SET unsubscribed_at = NULL, name = COALESCE($2, name) WHERE id = $1', [subscriber.id, name || '']);
          return res.json({ message: 'Welcome back! You have been re-subscribed.', id: subscriber.id });
        }
        return res.status(400).json({ error: 'This email is already subscribed' });
      }
      const result = await query(
        'INSERT INTO subscribers (email, name) VALUES ($1, $2) RETURNING id',
        [email.toLowerCase(), name || '']
      );
      return res.json({ message: 'Successfully subscribed!', id: result.rows[0].id });
    }
    
    // POST /api/unsubscribe
    if (url.match(/^\/api\/unsubscribe\/?$/) && method === 'POST') {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'Email is required' });
      await query('UPDATE subscribers SET unsubscribed_at = NOW() WHERE email = $1', [email.toLowerCase()]);
      return res.json({ message: 'Successfully unsubscribed' });
    }
    
    // GET /api/subscribe/check
    if (url.match(/^\/api\/subscribe\/check/) && method === 'GET') {
      const email = req.query.email as string;
      if (!email) return res.status(400).json({ error: 'Email is required' });
      const result = await query(
        'SELECT id, name, is_verified, subscribed_at FROM subscribers WHERE email = $1 AND unsubscribed_at IS NULL',
        [String(email).toLowerCase()]
      );
      if (result.rows.length === 0) {
        return res.json({ subscribed: false });
      }
      return res.json({ subscribed: true, subscriber: result.rows[0] });
    }
    
    // GET /api/search
    if (url.match(/^\/api\/search/) && method === 'GET') {
      const q = req.query.q;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      const searchQuery = `%${q}%`;
      const result = await query(
        `SELECT ${ARTICLE_SELECT} FROM articles a 
         JOIN categories c ON a.category_id = c.id 
         JOIN authors au ON a.author_id = au.id 
         WHERE a.title ILIKE $1 OR a.excerpt ILIKE $1 OR a.content ILIKE $1
         ORDER BY a.published_at DESC LIMIT 50`,
        [searchQuery]
      );
      return res.json(result.rows);
    }
    
    // POST /api/contact
    if (url.match(/^\/api\/contact\/?$/) && method === 'POST') {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      const mailOptions = {
        from: `"MT Kenya News Contact" <${process.env.SMTP_FROM || 'info@mtkenyanews.com'}>`,
        to: process.env.SMTP_FROM || 'info@mtkenyanews.com',
        replyTo: email,
        subject: `[Contact Form] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #1e3a8a, #1e40af, #dc2626); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">New Contact Form Submission</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 15px;"><strong>From:</strong> ${name}</p>
              <p style="margin: 0 0 15px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p style="margin: 0 0 15px;"><strong>Subject:</strong> ${subject}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="margin: 0 0 10px;"><strong>Message:</strong></p>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
        `,
        text: `New Contact Form Submission\n\nFrom: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      };

      const autoReplyOptions = {
        from: `"MT Kenya News" <${process.env.SMTP_FROM || 'info@mtkenyanews.com'}>`,
        to: email,
        subject: `Re: ${subject} - We received your message`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #1e3a8a, #1e40af, #dc2626); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Thank You for Contacting Us</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
              <p>Dear ${name},</p>
              <p>Thank you for reaching out to MT Kenya News. We have received your message and will get back to you as soon as possible.</p>
              <p>Best regards,<br>MT Kenya News Team</p>
            </div>
          </div>
        `,
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await emailTransporter.sendMail(mailOptions);
        await emailTransporter.sendMail(autoReplyOptions);
      }
      
      return res.json({ success: true, message: 'Message sent successfully' });
    }
    
    // POST /api/upload (Cloudinary)
    if (url.match(/^\/api\/upload\/?$/) && method === 'POST') {
      if (!checkAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { file, filename } = req.body || {};
      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      
      try {
        const uploadResult = await cloudinary.uploader.upload(file, {
          folder: 'mtkenyanews',
          public_id: `${Date.now()}-${filename?.replace(/[^a-zA-Z0-9.\-]/g, '_') || 'image'}`,
          resource_type: 'auto',
        });
        
        return res.json({ 
          url: uploadResult.secure_url, 
          public_id: uploadResult.public_id,
          filename: uploadResult.original_filename 
        });
      } catch (uploadError: any) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ error: 'Upload failed' });
      }
    }
    
    // =====================
    // ADMIN LOGIN
    // =====================
    
    // POST /api/admin/login
    if (url.match(/^\/api\/admin\/login\/?$/) && method === 'POST') {
      const { username, password } = req.body || {};
      if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = generateAdminToken({ username });
        return res.json({ token });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // =====================
    // ADMIN PROTECTED ENDPOINTS
    // =====================
    
    // Check admin for all /api/admin/* routes (except login)
    if (url.startsWith('/api/admin/') && !url.includes('/login')) {
      if (!checkAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }
    
    // GET /api/admin/stats
    if (url.match(/^\/api\/admin\/stats\/?$/) && method === 'GET') {
      const top = await query('SELECT id, title, views FROM articles ORDER BY views DESC LIMIT 10');
      const totals = await query("SELECT COUNT(*) AS articles_count, SUM(views) AS total_views FROM articles");
      return res.json({ top: top.rows, totals: totals.rows[0] });
    }
    
    // GET /api/admin/articles
    if (url.match(/^\/api\/admin\/articles\/?$/) && method === 'GET') {
      const q = `SELECT ${ARTICLE_SELECT} FROM articles a JOIN categories c ON a.category_id = c.id JOIN authors au ON a.author_id = au.id ORDER BY a.published_at DESC`;
      const result = await query(q);
      return res.json(result.rows);
    }
    
    // POST /api/admin/articles
    if (url.match(/^\/api\/admin\/articles\/?$/) && method === 'POST') {
      const a = req.body;
      const q = `INSERT INTO articles (title, slug, excerpt, content, featured_image, category_id, author_id, published_at, reading_time, is_featured, is_breaking) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`;
      const params = [a.title, a.slug, a.excerpt, a.content, a.featured_image, a.category_id, a.author_id, a.published_at, a.reading_time || 0, a.is_featured || false, a.is_breaking || false];
      const result = await query(q, params);
      return res.json(result.rows[0]);
    }
    
    // GET /api/admin/articles/:id
    const adminArticleGetMatch = url.match(/^\/api\/admin\/articles\/(\d+)\/?$/);
    if (adminArticleGetMatch && method === 'GET') {
      const id = adminArticleGetMatch[1];
      const q = `SELECT ${ARTICLE_SELECT} FROM articles a JOIN categories c ON a.category_id = c.id JOIN authors au ON a.author_id = au.id WHERE a.id = $1 LIMIT 1`;
      const result = await query(q, [id]);
      return res.json(result.rows[0] || null);
    }
    
    // PUT /api/admin/articles/:id
    if (adminArticleGetMatch && method === 'PUT') {
      const id = adminArticleGetMatch[1];
      const a = req.body;
      const fields: string[] = [];
      const params: any[] = [];
      let idx = 1;
      for (const key of ['title','slug','excerpt','content','featured_image','category_id','author_id','published_at','reading_time','is_featured','is_breaking']) {
        if (key in a) {
          fields.push(`${key} = $${idx}`);
          params.push((a as any)[key]);
          idx++;
        }
      }
      if (fields.length === 0) return res.status(400).json({ error: 'No fields' });
      params.push(id);
      const q = `UPDATE articles SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
      const result = await query(q, params);
      return res.json(result.rows[0]);
    }
    
    // DELETE /api/admin/articles/:id
    if (adminArticleGetMatch && method === 'DELETE') {
      const id = adminArticleGetMatch[1];
      await query('DELETE FROM articles WHERE id = $1', [id]);
      return res.json({ ok: true });
    }
    
    // POST /api/admin/categories
    if (url.match(/^\/api\/admin\/categories\/?$/) && method === 'POST') {
      const { name, slug, description } = req.body || {};
      if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });
      try {
        const result = await query(
          'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
          [name, slug, description || null]
        );
        return res.json(result.rows[0]);
      } catch (err: any) {
        if (err.code === '23505') return res.status(400).json({ error: 'Category slug already exists' });
        throw err;
      }
    }
    
    // PUT /api/admin/categories/:id
    const adminCategoryMatch = url.match(/^\/api\/admin\/categories\/(\d+)\/?$/);
    if (adminCategoryMatch && method === 'PUT') {
      const id = adminCategoryMatch[1];
      const { name, slug, description } = req.body || {};
      const fields: string[] = [];
      const params: any[] = [];
      let idx = 1;
      if (name) { fields.push(`name = $${idx++}`); params.push(name); }
      if (slug) { fields.push(`slug = $${idx++}`); params.push(slug); }
      if (description !== undefined) { fields.push(`description = $${idx++}`); params.push(description); }
      if (fields.length === 0) return res.status(400).json({ error: 'No fields' });
      params.push(id);
      const q = `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
      const result = await query(q, params);
      return res.json(result.rows[0]);
    }
    
    // DELETE /api/admin/categories/:id
    if (adminCategoryMatch && method === 'DELETE') {
      const id = adminCategoryMatch[1];
      const articlesCheck = await query('SELECT COUNT(*) FROM articles WHERE category_id = $1', [id]);
      if (parseInt(articlesCheck.rows[0].count) > 0) {
        return res.status(400).json({ error: 'Cannot delete category with articles' });
      }
      await query('DELETE FROM categories WHERE id = $1', [id]);
      return res.json({ ok: true });
    }
    
    // POST /api/admin/authors
    if (url.match(/^\/api\/admin\/authors\/?$/) && method === 'POST') {
      const { name, email, bio, avatar_url } = req.body || {};
      if (!name) return res.status(400).json({ error: 'Name required' });
      try {
        const result = await query(
          'INSERT INTO authors (name, email, bio, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
          [name, email || null, bio || null, avatar_url || null]
        );
        return res.json(result.rows[0]);
      } catch (err: any) {
        if (err.code === '23505') return res.status(400).json({ error: 'Author email already exists' });
        throw err;
      }
    }
    
    // PUT /api/admin/authors/:id
    const adminAuthorMatch = url.match(/^\/api\/admin\/authors\/(\d+)\/?$/);
    if (adminAuthorMatch && method === 'PUT') {
      const id = adminAuthorMatch[1];
      const { name, email, bio, avatar_url } = req.body || {};
      const fields: string[] = [];
      const params: any[] = [];
      let idx = 1;
      if (name) { fields.push(`name = $${idx++}`); params.push(name); }
      if (email !== undefined) { fields.push(`email = $${idx++}`); params.push(email || null); }
      if (bio !== undefined) { fields.push(`bio = $${idx++}`); params.push(bio); }
      if (avatar_url !== undefined) { fields.push(`avatar_url = $${idx++}`); params.push(avatar_url); }
      if (fields.length === 0) return res.status(400).json({ error: 'No fields' });
      params.push(id);
      const q = `UPDATE authors SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
      const result = await query(q, params);
      return res.json(result.rows[0]);
    }
    
    // DELETE /api/admin/authors/:id
    if (adminAuthorMatch && method === 'DELETE') {
      const id = adminAuthorMatch[1];
      const articlesCheck = await query('SELECT COUNT(*) FROM articles WHERE author_id = $1', [id]);
      if (parseInt(articlesCheck.rows[0].count) > 0) {
        return res.status(400).json({ error: 'Cannot delete author with articles' });
      }
      await query('DELETE FROM authors WHERE id = $1', [id]);
      return res.json({ ok: true });
    }
    
    // GET /api/admin/comments
    if (url.match(/^\/api\/admin\/comments\/?$/) && method === 'GET') {
      const result = await query(`
        SELECT 
          cm.id, cm.content, cm.is_approved, cm.created_at,
          a.title as article_title, a.slug as article_slug,
          s.name as subscriber_name, s.email as subscriber_email
        FROM comments cm
        JOIN articles a ON cm.article_id = a.id
        JOIN subscribers s ON cm.subscriber_id = s.id
        ORDER BY cm.created_at DESC
      `);
      return res.json(result.rows);
    }
    
    // PATCH /api/admin/comments/:id/approve
    const approveCommentMatch = url.match(/^\/api\/admin\/comments\/(\d+)\/approve\/?$/);
    if (approveCommentMatch && method === 'PATCH') {
      const id = approveCommentMatch[1];
      await query('UPDATE comments SET is_approved = true WHERE id = $1', [id]);
      return res.json({ success: true });
    }
    
    // DELETE /api/admin/comments/:id
    const deleteCommentMatch = url.match(/^\/api\/admin\/comments\/(\d+)\/?$/);
    if (deleteCommentMatch && method === 'DELETE') {
      const id = deleteCommentMatch[1];
      await query('DELETE FROM comments WHERE id = $1', [id]);
      return res.json({ success: true });
    }
    
    // GET /api/admin/subscribers
    if (url.match(/^\/api\/admin\/subscribers\/?$/) && method === 'GET') {
      const result = await query(`
        SELECT 
          s.id, s.email, s.name, s.is_verified, s.subscribed_at, s.unsubscribed_at,
          (SELECT COUNT(*) FROM comments WHERE subscriber_id = s.id) as comment_count,
          (SELECT COUNT(*) FROM article_likes WHERE subscriber_id = s.id) as like_count
        FROM subscribers s
        ORDER BY s.subscribed_at DESC
      `);
      return res.json(result.rows);
    }
    
    // DELETE /api/admin/subscribers/:id
    const deleteSubscriberMatch = url.match(/^\/api\/admin\/subscribers\/(\d+)\/?$/);
    if (deleteSubscriberMatch && method === 'DELETE') {
      const id = deleteSubscriberMatch[1];
      await query('DELETE FROM subscribers WHERE id = $1', [id]);
      return res.json({ success: true });
    }
    
    // Not found
    return res.status(404).json({ error: 'Not found' });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
