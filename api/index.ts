import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { v2 as cloudinary } from 'cloudinary';

// Database
const pool = new Pool({ 
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});

async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Auth
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'password';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'secret';

function genToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function checkToken(req: VercelRequest): boolean {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;
  try {
    jwt.verify(auth.split(' ')[1], JWT_SECRET);
    return true;
  } catch { return false; }
}

// Email
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// SQL Helper
const ARTICLE_SQL = `
  a.id, a.title, a.slug, a.excerpt, a.content, a.featured_image, a.category_id, a.author_id,
  a.published_at, a.reading_time, a.views, a.is_featured, a.is_breaking, a.created_at, a.updated_at,
  json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'description', c.description) as categories,
  json_build_object('id', au.id, 'name', au.name, 'bio', au.bio, 'avatar_url', au.avatar_url) as authors
`;

// Main Handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = (req.url || '').split('?')[0];
  const method = req.method || 'GET';

  try {
    // ===== PUBLIC ROUTES =====
    
    // Categories
    if (path === '/api/categories') {
      const r = await query('SELECT * FROM categories ORDER BY name');
      return res.json(r.rows);
    }

    // Authors
    if (path === '/api/authors') {
      const r = await query('SELECT * FROM authors ORDER BY name');
      return res.json(r.rows);
    }

    // Articles list
    if (path === '/api/articles') {
      const { featured, trending, limit, category_id } = req.query;
      const lim = parseInt((limit as string) || '10', 10);
      let sql = `SELECT ${ARTICLE_SQL} FROM articles a JOIN categories c ON a.category_id=c.id JOIN authors au ON a.author_id=au.id`;
      const params: any[] = [];
      
      if (category_id) {
        params.push(category_id);
        sql += ` WHERE a.category_id=$${params.length}`;
      }
      if (featured === 'true') {
        sql += params.length ? ' AND a.is_featured=true' : ' WHERE a.is_featured=true';
      }
      sql += trending === 'true' ? ' ORDER BY a.views DESC' : ' ORDER BY a.published_at DESC';
      sql += ` LIMIT ${lim}`;
      
      const r = await query(sql, params);
      return res.json(r.rows);
    }

    // Breaking news
    if (path === '/api/articles/breaking') {
      const lim = parseInt((req.query.limit as string) || '5', 10);
      const r = await query(
        `SELECT ${ARTICLE_SQL} FROM articles a JOIN categories c ON a.category_id=c.id JOIN authors au ON a.author_id=au.id WHERE a.is_breaking=true ORDER BY a.published_at DESC LIMIT $1`,
        [lim]
      );
      return res.json(r.rows);
    }

    // Related articles
    if (path === '/api/articles/related') {
      const { category_id, exclude_id, limit } = req.query;
      const r = await query(
        `SELECT ${ARTICLE_SQL} FROM articles a JOIN categories c ON a.category_id=c.id JOIN authors au ON a.author_id=au.id WHERE a.category_id=$1 AND a.id<>$2 ORDER BY a.published_at DESC LIMIT $3`,
        [category_id, exclude_id, parseInt((limit as string) || '3', 10)]
      );
      return res.json(r.rows);
    }

    // Article by slug
    const slugMatch = path.match(/^\/api\/articles\/slug\/(.+)$/);
    if (slugMatch) {
      const r = await query(
        `SELECT ${ARTICLE_SQL} FROM articles a JOIN categories c ON a.category_id=c.id JOIN authors au ON a.author_id=au.id WHERE a.slug=$1`,
        [decodeURIComponent(slugMatch[1])]
      );
      return res.json(r.rows[0] || null);
    }

    // Increment views
    const viewsMatch = path.match(/^\/api\/articles\/([^/]+)\/views$/);
    if (viewsMatch && method === 'POST') {
      const r = await query('UPDATE articles SET views=views+1 WHERE id=$1 RETURNING views', [viewsMatch[1]]);
      return res.json(r.rows[0] || null);
    }

    // Article comments
    const commentsMatch = path.match(/^\/api\/articles\/([^/]+)\/comments$/);
    if (commentsMatch) {
      if (method === 'GET') {
        const r = await query(
          `SELECT c.id,c.content,c.created_at,s.name as author_name FROM comments c JOIN subscribers s ON c.subscriber_id=s.id WHERE c.article_id=$1 AND c.is_approved=true ORDER BY c.created_at DESC`,
          [commentsMatch[1]]
        );
        return res.json(r.rows);
      }
      if (method === 'POST') {
        const { email, content } = req.body || {};
        if (!email || !content) return res.status(400).json({ error: 'Email and content required' });
        const sub = await query('SELECT id FROM subscribers WHERE email=$1 AND unsubscribed_at IS NULL', [email.toLowerCase()]);
        if (!sub.rows.length) return res.status(403).json({ error: 'Subscribe first to comment' });
        const r = await query('INSERT INTO comments (article_id,subscriber_id,content,is_approved) VALUES ($1,$2,$3,true) RETURNING id', [commentsMatch[1], sub.rows[0].id, content.trim()]);
        return res.json({ id: r.rows[0].id });
      }
    }

    // Article likes
    const likesMatch = path.match(/^\/api\/articles\/([^/]+)\/likes$/);
    if (likesMatch && method === 'GET') {
      const cnt = await query('SELECT COUNT(*) as count FROM article_likes WHERE article_id=$1', [likesMatch[1]]);
      let userLiked = false;
      if (req.query.email) {
        const chk = await query('SELECT 1 FROM article_likes al JOIN subscribers s ON al.subscriber_id=s.id WHERE al.article_id=$1 AND s.email=$2', [likesMatch[1], (req.query.email as string).toLowerCase()]);
        userLiked = chk.rows.length > 0;
      }
      return res.json({ count: parseInt(cnt.rows[0].count), userLiked });
    }

    const likeMatch = path.match(/^\/api\/articles\/([^/]+)\/like$/);
    if (likeMatch && method === 'POST') {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'Email required' });
      const sub = await query('SELECT id FROM subscribers WHERE email=$1 AND unsubscribed_at IS NULL', [email.toLowerCase()]);
      if (!sub.rows.length) return res.status(403).json({ error: 'Subscribe first' });
      const exists = await query('SELECT id FROM article_likes WHERE article_id=$1 AND subscriber_id=$2', [likeMatch[1], sub.rows[0].id]);
      if (exists.rows.length) {
        await query('DELETE FROM article_likes WHERE id=$1', [exists.rows[0].id]);
        return res.json({ liked: false });
      }
      await query('INSERT INTO article_likes (article_id,subscriber_id) VALUES ($1,$2)', [likeMatch[1], sub.rows[0].id]);
      return res.json({ liked: true });
    }

    // Subscribe
    if (path === '/api/subscribe' && method === 'POST') {
      const { email, name } = req.body || {};
      if (!email?.includes('@')) return res.status(400).json({ error: 'Valid email required' });
      const exists = await query('SELECT id,unsubscribed_at FROM subscribers WHERE email=$1', [email.toLowerCase()]);
      if (exists.rows.length) {
        if (exists.rows[0].unsubscribed_at) {
          await query('UPDATE subscribers SET unsubscribed_at=NULL WHERE id=$1', [exists.rows[0].id]);
          return res.json({ message: 'Re-subscribed!' });
        }
        return res.status(400).json({ error: 'Already subscribed' });
      }
      const r = await query('INSERT INTO subscribers (email,name) VALUES ($1,$2) RETURNING id', [email.toLowerCase(), name || '']);
      return res.json({ message: 'Subscribed!', id: r.rows[0].id });
    }

    // Unsubscribe
    if (path === '/api/unsubscribe' && method === 'POST') {
      const { email } = req.body || {};
      await query('UPDATE subscribers SET unsubscribed_at=NOW() WHERE email=$1', [email?.toLowerCase()]);
      return res.json({ message: 'Unsubscribed' });
    }

    // Check subscription
    if (path === '/api/subscribe/check') {
      const r = await query('SELECT id,name FROM subscribers WHERE email=$1 AND unsubscribed_at IS NULL', [(req.query.email as string)?.toLowerCase()]);
      return res.json({ subscribed: r.rows.length > 0, subscriber: r.rows[0] });
    }

    // Search
    if (path === '/api/search') {
      const q = req.query.q;
      if (!q) return res.json([]);
      const r = await query(
        `SELECT ${ARTICLE_SQL} FROM articles a JOIN categories c ON a.category_id=c.id JOIN authors au ON a.author_id=au.id WHERE a.title ILIKE $1 OR a.excerpt ILIKE $1 ORDER BY a.published_at DESC LIMIT 50`,
        [`%${q}%`]
      );
      return res.json(r.rows);
    }

    // Contact
    if (path === '/api/contact' && method === 'POST') {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !subject || !message) return res.status(400).json({ error: 'All fields required' });
      if (process.env.SMTP_USER) {
        await mailer.sendMail({
          from: `"MT Kenya News" <${process.env.SMTP_FROM}>`,
          to: process.env.SMTP_FROM,
          replyTo: email,
          subject: `[Contact] ${subject}`,
          text: `From: ${name} (${email})\n\n${message}`,
        });
      }
      return res.json({ success: true });
    }

    // Upload (Cloudinary)
    if (path === '/api/upload' && method === 'POST') {
      if (!checkToken(req)) return res.status(401).json({ error: 'Unauthorized' });
      
      const { file, filename } = req.body || {};
      if (!file) return res.status(400).json({ error: 'No file provided' });
      
      // Validate that Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('Cloudinary not configured');
        return res.status(500).json({ error: 'Image storage not configured' });
      }
      
      try {
        const result = await cloudinary.uploader.upload(file, {
          folder: 'mtkenyanews',
          public_id: `${Date.now()}-${filename?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'img'}`,
          resource_type: 'auto',
        });
        return res.json({ url: result.secure_url });
      } catch (uploadErr: any) {
        console.error('Cloudinary upload error:', uploadErr);
        return res.status(500).json({ error: uploadErr.message || 'Upload to storage failed' });
      }
    }

    // ===== ADMIN ROUTES =====
    
    // Login
    if (path === '/api/admin/login' && method === 'POST') {
      const { username, password } = req.body || {};
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        return res.json({ token: genToken({ username }) });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Admin auth check for all other admin routes
    if (path.startsWith('/api/admin/') && !checkToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admin stats
    if (path === '/api/admin/stats') {
      const top = await query('SELECT id,title,views FROM articles ORDER BY views DESC LIMIT 10');
      const totals = await query('SELECT COUNT(*) as articles_count, SUM(views) as total_views FROM articles');
      return res.json({ top: top.rows, totals: totals.rows[0] });
    }

    // Admin articles
    if (path === '/api/admin/articles') {
      if (method === 'GET') {
        const r = await query(`SELECT ${ARTICLE_SQL} FROM articles a JOIN categories c ON a.category_id=c.id JOIN authors au ON a.author_id=au.id ORDER BY a.published_at DESC`);
        return res.json(r.rows);
      }
      if (method === 'POST') {
        const a = req.body;
        const r = await query(
          'INSERT INTO articles (title,slug,excerpt,content,featured_image,category_id,author_id,published_at,reading_time,is_featured,is_breaking) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
          [a.title, a.slug, a.excerpt, a.content, a.featured_image, a.category_id, a.author_id, a.published_at, a.reading_time || 0, a.is_featured || false, a.is_breaking || false]
        );
        return res.json(r.rows[0]);
      }
    }

    // Admin single article
    const adminArtMatch = path.match(/^\/api\/admin\/articles\/([^/]+)$/);
    if (adminArtMatch) {
      const id = adminArtMatch[1];
      if (method === 'GET') {
        const r = await query(`SELECT ${ARTICLE_SQL} FROM articles a JOIN categories c ON a.category_id=c.id JOIN authors au ON a.author_id=au.id WHERE a.id=$1`, [id]);
        return res.json(r.rows[0] || null);
      }
      if (method === 'PUT') {
        const a = req.body;
        const sets: string[] = [];
        const vals: any[] = [];
        ['title','slug','excerpt','content','featured_image','category_id','author_id','published_at','reading_time','is_featured','is_breaking'].forEach(k => {
          if (k in a) { vals.push(a[k]); sets.push(`${k}=$${vals.length}`); }
        });
        vals.push(id);
        const r = await query(`UPDATE articles SET ${sets.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
        return res.json(r.rows[0]);
      }
      if (method === 'DELETE') {
        await query('DELETE FROM articles WHERE id=$1', [id]);
        return res.json({ ok: true });
      }
    }

    // Admin categories
    if (path === '/api/admin/categories' && method === 'POST') {
      const { name, slug, description } = req.body;
      const r = await query('INSERT INTO categories (name,slug,description) VALUES ($1,$2,$3) RETURNING *', [name, slug, description]);
      return res.json(r.rows[0]);
    }

    const adminCatMatch = path.match(/^\/api\/admin\/categories\/([^/]+)$/);
    if (adminCatMatch) {
      const id = adminCatMatch[1];
      if (method === 'PUT') {
        const { name, slug, description } = req.body;
        const r = await query('UPDATE categories SET name=$1,slug=$2,description=$3 WHERE id=$4 RETURNING *', [name, slug, description, id]);
        return res.json(r.rows[0]);
      }
      if (method === 'DELETE') {
        await query('DELETE FROM categories WHERE id=$1', [id]);
        return res.json({ ok: true });
      }
    }

    // Admin authors
    if (path === '/api/admin/authors' && method === 'POST') {
      const { name, email, bio, avatar_url } = req.body;
      const r = await query('INSERT INTO authors (name,email,bio,avatar_url) VALUES ($1,$2,$3,$4) RETURNING *', [name, email, bio, avatar_url]);
      return res.json(r.rows[0]);
    }

    const adminAuthMatch = path.match(/^\/api\/admin\/authors\/([^/]+)$/);
    if (adminAuthMatch) {
      const id = adminAuthMatch[1];
      if (method === 'PUT') {
        const { name, email, bio, avatar_url } = req.body;
        const r = await query('UPDATE authors SET name=$1,email=$2,bio=$3,avatar_url=$4 WHERE id=$5 RETURNING *', [name, email, bio, avatar_url, id]);
        return res.json(r.rows[0]);
      }
      if (method === 'DELETE') {
        await query('DELETE FROM authors WHERE id=$1', [id]);
        return res.json({ ok: true });
      }
    }

    // Admin comments
    if (path === '/api/admin/comments') {
      const r = await query('SELECT c.*,a.title as article_title,s.name as subscriber_name,s.email as subscriber_email FROM comments c JOIN articles a ON c.article_id=a.id JOIN subscribers s ON c.subscriber_id=s.id ORDER BY c.created_at DESC');
      return res.json(r.rows);
    }

    const approveMatch = path.match(/^\/api\/admin\/comments\/([^/]+)\/approve$/);
    if (approveMatch && method === 'PATCH') {
      await query('UPDATE comments SET is_approved=true WHERE id=$1', [approveMatch[1]]);
      return res.json({ ok: true });
    }

    const delCommentMatch = path.match(/^\/api\/admin\/comments\/([^/]+)$/);
    if (delCommentMatch && method === 'DELETE') {
      await query('DELETE FROM comments WHERE id=$1', [delCommentMatch[1]]);
      return res.json({ ok: true });
    }

    // Admin subscribers
    if (path === '/api/admin/subscribers') {
      const r = await query('SELECT * FROM subscribers ORDER BY subscribed_at DESC');
      return res.json(r.rows);
    }

    const delSubMatch = path.match(/^\/api\/admin\/subscribers\/([^/]+)$/);
    if (delSubMatch && method === 'DELETE') {
      await query('DELETE FROM subscribers WHERE id=$1', [delSubMatch[1]]);
      return res.json({ ok: true });
    }

    // 404
    return res.status(404).json({ error: 'Not found', path });

  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
