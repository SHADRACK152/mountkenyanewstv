import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { query } from './db.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 4000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'password';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change-me';

// Email configuration (Namecheap Private Email)
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify email configuration on startup
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  emailTransporter.verify((error, success) => {
    if (error) {
      console.log('Email configuration error:', error.message);
    } else {
      console.log('✓ Email server is ready to send messages');
    }
  });
}

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

function adminMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  const decoded = verifyAdminToken(token);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  req.admin = decoded;
  next();
}

// --- Uploads setup ---
const UPLOAD_DIR = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_')}`),
});
const upload = multer({ storage });

// S3 presign helper (optional)
const S3_BUCKET = process.env.AWS_S3_BUCKET;
const S3_REGION = process.env.AWS_REGION;
const s3Client = S3_BUCKET && S3_REGION ? new S3Client({ region: S3_REGION }) : null;


// Helpers to build joined article with category & author
const ARTICLE_SELECT = `
  a.id, a.title, a.slug, a.excerpt, a.content, a.featured_image, a.category_id, a.author_id,
  a.published_at, a.reading_time, a.views, a.is_featured, a.is_breaking, a.created_at, a.updated_at,
  json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'description', c.description) as categories,
  json_build_object('id', au.id, 'name', au.name, 'bio', au.bio, 'avatar_url', au.avatar_url) as authors
`;

app.get('/api/categories', async (req, res) => {
  try {
    const result = await query('SELECT id, name, slug, description, created_at FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

app.get('/api/authors', async (req, res) => {
  try {
    const result = await query('SELECT id, name, bio, avatar_url, created_at FROM authors ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

app.get('/api/articles/slug/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const q = `SELECT ${ARTICLE_SELECT} FROM articles a JOIN categories c ON a.category_id = c.id JOIN authors au ON a.author_id = au.id WHERE a.slug = $1 LIMIT 1`;
    const result = await query(q, [slug]);
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

app.post('/api/articles/:id/views', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('UPDATE articles SET views = views + 1 WHERE id = $1 RETURNING views', [id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// Admin login route (returns JWT)
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = generateAdminToken({ username });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// Admin CRUD for articles (protected)
app.post('/api/admin/articles', adminMiddleware, async (req, res) => {
  const a = req.body;
  try {
    const q = `INSERT INTO articles (title, slug, excerpt, content, featured_image, category_id, author_id, published_at, reading_time, is_featured, is_breaking) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`;
    const params = [a.title, a.slug, a.excerpt, a.content, a.featured_image, a.category_id, a.author_id, a.published_at, a.reading_time || 0, a.is_featured || false, a.is_breaking || false];
    const result = await query(q, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

app.put('/api/admin/articles/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const a = req.body;
  try {
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
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

app.delete('/api/admin/articles/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM articles WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// Admin: list all articles
app.get('/api/admin/articles', adminMiddleware, async (req, res) => {
  try {
    const q = `SELECT ${ARTICLE_SELECT} FROM articles a JOIN categories c ON a.category_id = c.id JOIN authors au ON a.author_id = au.id ORDER BY a.published_at DESC`;
    const result = await query(q);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// Admin: get article by id
app.get('/api/admin/articles/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const q = `SELECT ${ARTICLE_SELECT} FROM articles a JOIN categories c ON a.category_id = c.id JOIN authors au ON a.author_id = au.id WHERE a.id = $1 LIMIT 1`;
    const result = await query(q, [id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// Admin stats endpoint
app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const top = await query('SELECT id, title, views FROM articles ORDER BY views DESC LIMIT 10');
    const totals = await query("SELECT COUNT(*) AS articles_count, SUM(views) AS total_views FROM articles");
    res.json({ top: top.rows, totals: totals.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// =====================
// ADMIN CATEGORIES
// =====================

app.post('/api/admin/categories', adminMiddleware, async (req, res) => {
  const { name, slug, description } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });
  try {
    const result = await query(
      'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
      [name, slug, description || null]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'Category slug already exists' });
    res.status(500).json({ error: 'failed' });
  }
});

app.put('/api/admin/categories/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, slug, description } = req.body || {};
  try {
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
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'Category slug already exists' });
    res.status(500).json({ error: 'failed' });
  }
});

app.delete('/api/admin/categories/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // Check if category has articles
    const articlesCheck = await query('SELECT COUNT(*) FROM articles WHERE category_id = $1', [id]);
    if (parseInt(articlesCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete category with articles' });
    }
    await query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// =====================
// ADMIN AUTHORS
// =====================

app.post('/api/admin/authors', adminMiddleware, async (req, res) => {
  const { name, email, bio, avatar_url } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const result = await query(
      'INSERT INTO authors (name, email, bio, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email || null, bio || null, avatar_url || null]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'Author email already exists' });
    res.status(500).json({ error: 'failed' });
  }
});

app.put('/api/admin/authors/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, email, bio, avatar_url } = req.body || {};
  try {
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
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'Author email already exists' });
    res.status(500).json({ error: 'failed' });
  }
});

app.delete('/api/admin/authors/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // Check if author has articles
    const articlesCheck = await query('SELECT COUNT(*) FROM articles WHERE author_id = $1', [id]);
    if (parseInt(articlesCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete author with articles' });
    }
    await query('DELETE FROM authors WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

app.get('/api/articles/related', async (req, res) => {
  const { category_id, exclude_id, limit } = req.query;
  const lim = parseInt((limit as string) || '3', 10);
  try {
    const q = `SELECT ${ARTICLE_SELECT} FROM articles a JOIN categories c ON a.category_id = c.id JOIN authors au ON a.author_id = au.id WHERE a.category_id = $1 AND a.id <> $2 ORDER BY a.published_at DESC LIMIT $3`;
    const result = await query(q, [category_id, exclude_id, lim]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

app.get('/api/articles', async (req, res) => {
  // Supports ?featured=true, ?trending=true, ?limit=5, ?category_id=...
  const { featured, trending, limit, category_id } = req.query;
  const lim = parseInt((limit as string) || '5', 10);
  try {
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
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// Dedicated breaking news endpoint
app.get('/api/articles/breaking', async (req, res) => {
  const { limit } = req.query;
  const lim = parseInt((limit as string) || '5', 10);
  try {
    const q = `SELECT ${ARTICLE_SELECT} FROM articles a JOIN categories c ON a.category_id = c.id JOIN authors au ON a.author_id = au.id WHERE a.is_breaking = true ORDER BY a.published_at DESC LIMIT $1`;
    const result = await query(q, [lim]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// File upload to server
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'upload-failed' });
  }
});

// Presign S3 PUT URL (optional) - requires AWS env vars
app.post('/api/upload/presign', async (req, res) => {
  if (!s3Client || !S3_BUCKET) return res.status(400).json({ error: 's3-not-configured' });
  const { filename, contentType } = req.body || {};
  if (!filename || !contentType) return res.status(400).json({ error: 'missing-params' });
  try {
    const key = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
    const command = new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const publicUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
    res.json({ url, key, publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'presign-failed' });
  }
});

// =====================
// SUBSCRIPTION ENDPOINTS
// =====================

// Subscribe to newsletter
app.post('/api/subscribe', async (req, res) => {
  const { email, name } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  try {
    // Check if already subscribed
    const existing = await query('SELECT id, unsubscribed_at FROM subscribers WHERE email = $1', [email.toLowerCase()]);
    
    if (existing.rows.length > 0) {
      const subscriber = existing.rows[0];
      if (subscriber.unsubscribed_at) {
        // Re-subscribe
        await query('UPDATE subscribers SET unsubscribed_at = NULL, name = COALESCE($2, name) WHERE id = $1', [subscriber.id, name || '']);
        return res.json({ message: 'Welcome back! You have been re-subscribed.', id: subscriber.id });
      }
      return res.status(400).json({ error: 'This email is already subscribed' });
    }
    
    // Create new subscriber
    const result = await query(
      'INSERT INTO subscribers (email, name) VALUES ($1, $2) RETURNING id',
      [email.toLowerCase(), name || '']
    );
    
    res.json({ message: 'Successfully subscribed!', id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Subscription failed. Please try again.' });
  }
});

// Unsubscribe from newsletter
app.post('/api/unsubscribe', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  try {
    await query('UPDATE subscribers SET unsubscribed_at = NOW() WHERE email = $1', [email.toLowerCase()]);
    res.json({ message: 'Successfully unsubscribed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unsubscribe failed' });
  }
});

// Check subscription status
app.get('/api/subscribe/check', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  try {
    const result = await query(
      'SELECT id, name, is_verified, subscribed_at FROM subscribers WHERE email = $1 AND unsubscribed_at IS NULL',
      [String(email).toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.json({ subscribed: false });
    }
    
    res.json({ subscribed: true, subscriber: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Check failed' });
  }
});

// =====================
// COMMENTS ENDPOINTS (requires subscription)
// =====================

// Get comments for an article
app.get('/api/articles/:id/comments', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT c.id, c.content, c.created_at, s.name as author_name 
       FROM comments c 
       JOIN subscribers s ON c.subscriber_id = s.id 
       WHERE c.article_id = $1 AND c.is_approved = true 
       ORDER BY c.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a comment (requires subscription)
app.post('/api/articles/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { email, content } = req.body || {};
  
  if (!email || !content) {
    return res.status(400).json({ error: 'Email and content are required' });
  }
  
  try {
    // Check if subscriber exists
    const subscriber = await query(
      'SELECT id FROM subscribers WHERE email = $1 AND unsubscribed_at IS NULL',
      [email.toLowerCase()]
    );
    
    if (subscriber.rows.length === 0) {
      return res.status(403).json({ error: 'You must be subscribed to comment. Please subscribe first.' });
    }
    
    const subscriberId = subscriber.rows[0].id;
    
    // Add comment (pending approval by default)
    const result = await query(
      'INSERT INTO comments (article_id, subscriber_id, content, is_approved) VALUES ($1, $2, $3, $4) RETURNING id',
      [id, subscriberId, content.trim(), true] // Auto-approve for now
    );
    
    res.json({ message: 'Comment added successfully', id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// =====================
// ARTICLE LIKES (requires subscription)
// =====================

// Get like count for an article
app.get('/api/articles/:id/likes', async (req, res) => {
  const { id } = req.params;
  const email = req.query.email as string | undefined;
  
  try {
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
    
    res.json({ count, userLiked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get likes' });
  }
});

// Like an article (requires subscription)
app.post('/api/articles/:id/like', async (req, res) => {
  const { id } = req.params;
  const { email } = req.body || {};
  
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  try {
    const subscriber = await query(
      'SELECT id FROM subscribers WHERE email = $1 AND unsubscribed_at IS NULL',
      [email.toLowerCase()]
    );
    
    if (subscriber.rows.length === 0) {
      return res.status(403).json({ error: 'You must be subscribed to like articles' });
    }
    
    const subscriberId = subscriber.rows[0].id;
    
    // Toggle like
    const existing = await query(
      'SELECT id FROM article_likes WHERE article_id = $1 AND subscriber_id = $2',
      [id, subscriberId]
    );
    
    if (existing.rows.length > 0) {
      // Unlike
      await query('DELETE FROM article_likes WHERE id = $1', [existing.rows[0].id]);
      res.json({ liked: false, message: 'Unliked' });
    } else {
      // Like
      await query('INSERT INTO article_likes (article_id, subscriber_id) VALUES ($1, $2)', [id, subscriberId]);
      res.json({ liked: true, message: 'Liked' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Like failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Neon API listening on ${PORT}`);
});

// ========== SEARCH ==========
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.json([]);
  }
  try {
    const searchQuery = `%${q}%`;
    const result = await query(
      `SELECT ${ARTICLE_SELECT} FROM articles a 
       JOIN categories c ON a.category_id = c.id 
       JOIN authors au ON a.author_id = au.id 
       WHERE a.title ILIKE $1 OR a.excerpt ILIKE $1 OR a.content ILIKE $1
       ORDER BY a.published_at DESC LIMIT 50`,
      [searchQuery]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ========== CONTACT FORM ==========
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  try {
    // Send email notification
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
          <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This message was sent from the MT Kenya News website contact form.</p>
          </div>
        </div>
      `,
      text: `New Contact Form Submission\n\nFrom: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    };

    // Send auto-reply to the sender
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
            <p><strong>Your message:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 15px 0;">
              <p style="margin: 0 0 10px;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 0;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p>We typically respond within 24-48 business hours.</p>
            <p>Best regards,<br>MT Kenya News Team</p>
          </div>
          <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>© ${new Date().getFullYear()} MT Kenya News. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    // Check if email is configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await emailTransporter.sendMail(mailOptions);
      await emailTransporter.sendMail(autoReplyOptions);
      console.log('Contact form email sent successfully to:', email);
    } else {
      console.log('Email not configured. Contact form submission:', { name, email, subject, message });
    }
    
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err: any) {
    console.error('Failed to send contact email:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

// ========== ADMIN: COMMENTS ==========
app.get('/api/admin/comments', adminMiddleware, async (req, res) => {
  try {
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
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.patch('/api/admin/comments/:id/approve', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await query('UPDATE comments SET is_approved = true WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve comment' });
  }
});

app.delete('/api/admin/comments/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM comments WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ========== ADMIN: SUBSCRIBERS ==========
app.get('/api/admin/subscribers', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        s.id, s.email, s.name, s.is_verified, s.subscribed_at, s.unsubscribed_at,
        (SELECT COUNT(*) FROM comments WHERE subscriber_id = s.id) as comment_count,
        (SELECT COUNT(*) FROM article_likes WHERE subscriber_id = s.id) as like_count
      FROM subscribers s
      ORDER BY s.subscribed_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

app.delete('/api/admin/subscribers/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM subscribers WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subscriber' });
  }
});
