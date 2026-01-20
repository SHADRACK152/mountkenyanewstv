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

  // Get the original path (Vercel provides this in x-vercel-forwarded-for or we can parse from referrer/original URL)
  const originalUrl = (req.headers['x-vercel-original-url'] as string) || req.url || '';
  const path = originalUrl.split('?')[0];
  const method = req.method || 'GET';

  try {
    // ===== SHORT LINK REDIRECT (check first for /s/:code pattern) =====
    const shortLinkMatch = path.match(/^\/s\/([A-Za-z0-9]+)$/);
    if (shortLinkMatch) {
      const code = shortLinkMatch[1];
      
      // Find the article
      const result = await query(
        `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, c.name as category_name
         FROM short_links sl
         JOIN articles a ON sl.article_id = a.id
         JOIN categories c ON a.category_id = c.id
         WHERE sl.code = $1`,
        [code]
      );
      
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Short link not found' });
      }
      
      const article = result.rows[0];
      const fullUrl = `https://www.mtkenyanews.com/#article/${article.slug}`;
      
      // Track click
      await query('UPDATE short_links SET clicks = clicks + 1 WHERE code = $1', [code]);
      
      // Check if request is from a social media crawler/bot
      const userAgent = (req.headers['user-agent'] || '').toLowerCase();
      const isCrawler = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|pinterestbot|googlebot|bingbot|yandex|baiduspider|duckduckbot/i.test(userAgent);
      
      if (isCrawler) {
        // Serve HTML with Open Graph meta tags for crawlers to parse preview
        function escapeHtml(text: string): string {
          return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        }
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(article.title)} - MT Kenya News</title>
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${fullUrl}">
  <meta property="og:title" content="${escapeHtml(article.title)}">
  <meta property="og:description" content="${escapeHtml(article.excerpt || '')}">
  <meta property="og:image" content="${article.featured_image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="MT Kenya News">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${fullUrl}">
  <meta name="twitter:title" content="${escapeHtml(article.title)}">
  <meta name="twitter:description" content="${escapeHtml(article.excerpt || '')}">
  <meta name="twitter:image" content="${article.featured_image}">
  
  <!-- WhatsApp specific -->
  <meta property="og:image:alt" content="${escapeHtml(article.title)}">
  
  <link rel="canonical" href="${fullUrl}">
</head>
<body></body>
</html>`;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour for crawlers
        return res.status(200).send(html);
      } else {
        // Regular user - redirect with multiple fallbacks for mobile browsers
        const redirectHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${fullUrl}">
  <script>window.location.replace("${fullUrl}");</script>
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to article... <a href="${fullUrl}">Click here</a> if not redirected.</p>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(200).send(redirectHtml);
      }
    }
    
    // ===== POLL SHORT LINK REDIRECT (check for /p/:code pattern) =====
    const pollLinkMatch = path.match(/^\/p\/([A-Za-z0-9]+)$/);
    if (pollLinkMatch) {
      const code = pollLinkMatch[1];
      
      // Find the poll
      const result = await query(
        `SELECT p.id, p.title, p.description, p.status, p.end_date
         FROM poll_links pl
         JOIN polls p ON pl.poll_id = p.id
         WHERE pl.code = $1`,
        [code]
      );
      
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Poll link not found' });
      }
      
      const poll = result.rows[0];
      const fullUrl = `https://www.mtkenyanews.com/#poll/${poll.id}`;
      
      // Track click
      await query('UPDATE poll_links SET clicks = clicks + 1 WHERE code = $1', [code]);
      
      // Check if request is from a social media crawler/bot
      const userAgent = (req.headers['user-agent'] || '').toLowerCase();
      const isCrawler = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|pinterestbot|googlebot|bingbot|yandex|baiduspider|duckduckbot/i.test(userAgent);
      
      if (isCrawler) {
        // Serve HTML with Open Graph meta tags for crawlers to parse preview
        function escapeHtml(text: string): string {
          return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        }
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(poll.title)} - Vote Now | MT Kenya News</title>
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${fullUrl}">
  <meta property="og:title" content="🗳️ ${escapeHtml(poll.title)}">
  <meta property="og:description" content="${escapeHtml(poll.description || 'Cast your vote now on MT Kenya News!')}">
  <meta property="og:image" content="https://www.mtkenyanews.com/mtker.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="MT Kenya News">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${fullUrl}">
  <meta name="twitter:title" content="🗳️ ${escapeHtml(poll.title)}">
  <meta name="twitter:description" content="${escapeHtml(poll.description || 'Cast your vote now on MT Kenya News!')}">
  <meta name="twitter:image" content="https://www.mtkenyanews.com/mtker.png">
  
  <link rel="canonical" href="${fullUrl}">
</head>
<body></body>
</html>`;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(html);
      } else {
        // Regular user - redirect with multiple fallbacks
        const redirectHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${fullUrl}">
  <script>window.location.replace("${fullUrl}");</script>
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to poll... <a href="${fullUrl}">Click here</a> if not redirected.</p>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(200).send(redirectHtml);
      }
    }
    
    // ===== PUBLIC ROUTES =====
    
    // Setup short_links table (one-time setup)
    if (path === '/api/setup-short-links') {
      const secretKey = 'mtkenya2025fix';
      const providedKey = new URL(req.url || '', 'http://localhost').searchParams.get('key');
      
      if (providedKey !== secretKey) {
        return res.status(401).json({ error: 'Invalid key' });
      }
      
      // Create short_links table
      await query(`
        CREATE TABLE IF NOT EXISTS short_links (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(10) UNIQUE NOT NULL,
          article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
          clicks INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      // Create index for fast lookups
      await query(`CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(code)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_short_links_article ON short_links(article_id)`);
      
      return res.json({
        success: true,
        message: 'short_links table created successfully'
      });
    }
    
    // Fix malformed slugs (one-time fix)
    if (path === '/api/fix-slugs') {
      const secretKey = 'mtkenya2025fix';
      const providedKey = new URL(req.url || '', 'http://localhost').searchParams.get('key');
      
      if (providedKey !== secretKey) {
        return res.status(401).json({ error: 'Invalid key' });
      }
      
      // Get all articles with malformed slugs (containing spaces or uppercase)
      const articles = await query(`SELECT id, title, slug FROM articles`);
      const fixed: any[] = [];
      
      for (const article of articles.rows) {
        // Create proper slug: lowercase, replace spaces with dashes, remove special chars
        const properSlug = article.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with dashes
          .replace(/-+/g, '-') // Replace multiple dashes with single dash
          .replace(/^-|-$/g, '') // Remove leading/trailing dashes
          .substring(0, 100); // Limit length
        
        if (article.slug !== properSlug) {
          await query(`UPDATE articles SET slug = $1 WHERE id = $2`, [properSlug, article.id]);
          fixed.push({ id: article.id, oldSlug: article.slug, newSlug: properSlug });
        }
      }
      
      return res.json({
        success: true,
        message: 'Fixed malformed slugs',
        fixed: fixed.length,
        details: fixed
      });
    }
    
    // One-time emergency fix for localhost images (uses secret key)
    if (path === '/api/emergency-fix-images') {
      const secretKey = 'mtkenya2025fix';
      const providedKey = new URL(req.url || '', 'http://localhost').searchParams.get('key');
      
      if (providedKey !== secretKey) {
        return res.status(401).json({ error: 'Invalid key' });
      }
      
      // Use placeholder images
      const placeholderImage = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80';
      const placeholderAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80';
      
      // Update article featured images
      const articlesUpdate = await query(
        `UPDATE articles SET featured_image = $1 WHERE featured_image LIKE '%localhost%' RETURNING id, title`,
        [placeholderImage]
      );
      
      // Update localhost URLs inside article content
      const contentUpdate = await query(
        `UPDATE articles SET content = REPLACE(content, 'http://localhost:4000/uploads/', $1) WHERE content LIKE '%localhost%' RETURNING id, title`,
        [placeholderImage.replace('?w=800&q=80', '/')]
      );
      
      // Update authors
      const authorsUpdate = await query(
        `UPDATE authors SET avatar_url = $1 WHERE avatar_url LIKE '%localhost%' RETURNING id, name`,
        [placeholderAvatar]
      );
      
      return res.json({
        success: true,
        message: 'Fixed broken image URLs',
        fixed: {
          featuredImages: articlesUpdate.rows.length,
          contentImages: contentUpdate.rows.length,
          authors: authorsUpdate.rows.length,
          details: {
            featuredArticles: articlesUpdate.rows,
            contentArticles: contentUpdate.rows,
            authors: authorsUpdate.rows
          }
        }
      });
    }
    
    // Fix broken image URLs (one-time fix for localhost URLs)
    if (path === '/api/fix-images' && method === 'POST') {
      if (!checkToken(req)) return res.status(401).json({ error: 'Unauthorized - admin only' });
      
      // Find all articles with localhost image URLs
      const articlesResult = await query(
        `SELECT id, title, featured_image FROM articles WHERE featured_image LIKE '%localhost%'`
      );
      
      // Find all authors with localhost avatar URLs
      const authorsResult = await query(
        `SELECT id, name, avatar_url FROM authors WHERE avatar_url LIKE '%localhost%'`
      );
      
      const issues = {
        articles: articlesResult.rows.map(a => ({ id: a.id, title: a.title, image: a.featured_image })),
        authors: authorsResult.rows.map(a => ({ id: a.id, name: a.name, avatar: a.avatar_url })),
      };
      
      return res.json({
        message: 'Found broken image URLs that need to be re-uploaded',
        count: {
          articles: articlesResult.rows.length,
          authors: authorsResult.rows.length
        },
        issues,
        fix: 'Please edit each article/author in the admin panel and re-upload the images. They will now be stored in Cloudinary.'
      });
    }
    
    // Auto-fix broken localhost images with a placeholder
    if (path === '/api/fix-images-auto' && method === 'POST') {
      if (!checkToken(req)) return res.status(401).json({ error: 'Unauthorized - admin only' });
      
      // Use a nice placeholder image
      const placeholderImage = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80';
      const placeholderAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80';
      
      // Update articles with localhost images
      const articlesUpdate = await query(
        `UPDATE articles SET featured_image = $1 WHERE featured_image LIKE '%localhost%' RETURNING id, title`,
        [placeholderImage]
      );
      
      // Update authors with localhost avatars
      const authorsUpdate = await query(
        `UPDATE authors SET avatar_url = $1 WHERE avatar_url LIKE '%localhost%' RETURNING id, name`,
        [placeholderAvatar]
      );
      
      return res.json({
        message: 'Fixed broken image URLs with placeholder images',
        fixed: {
          articles: articlesUpdate.rows,
          authors: authorsUpdate.rows
        },
        note: 'You can now edit each article/author to upload proper images via Cloudinary.'
      });
    }
    
    // Test Cloudinary connection
    if (path === '/api/test-cloudinary') {
      const config = {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET',
        api_key: process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'NOT SET',
        api_secret: process.env.CLOUDINARY_API_SECRET ? '***configured***' : 'NOT SET',
      };
      
      // Try to ping Cloudinary
      try {
        const result = await cloudinary.api.ping();
        return res.json({ 
          status: 'connected', 
          config,
          ping: result
        });
      } catch (pingErr: any) {
        return res.json({ 
          status: 'error', 
          config,
          error: pingErr.message || 'Failed to connect to Cloudinary'
        });
      }
    }
    
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
        console.error('Cloudinary not configured:', {
          cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
          api_key: !!process.env.CLOUDINARY_API_KEY,
          api_secret: !!process.env.CLOUDINARY_API_SECRET
        });
        return res.status(500).json({ error: 'Image storage not configured. Please check Cloudinary settings.' });
      }
      
      // Check file size (base64 is ~33% larger than binary)
      const base64Size = file.length * 0.75; // Approximate original size
      if (base64Size > 15 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large. Maximum 10MB allowed.' });
      }
      
      try {
        console.log('Uploading to Cloudinary...', { 
          filename, 
          size: Math.round(base64Size / 1024) + 'KB',
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME
        });
        
        const result = await cloudinary.uploader.upload(file, {
          folder: 'mtkenyanews',
          public_id: `${Date.now()}-${filename?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'img'}`,
          resource_type: 'auto',
          transformation: [
            { quality: 'auto:good', fetch_format: 'auto' }
          ]
        });
        
        console.log('Upload successful:', result.secure_url);
        return res.json({ url: result.secure_url, public_id: result.public_id });
      } catch (uploadErr: any) {
        console.error('Cloudinary upload error:', uploadErr.message || uploadErr);
        
        // Provide user-friendly error messages
        let errorMessage = 'Upload failed. ';
        if (uploadErr.message?.includes('File size too large')) {
          errorMessage += 'Image is too large. Please use a smaller image.';
        } else if (uploadErr.message?.includes('Invalid image')) {
          errorMessage += 'Invalid image format. Please use JPG, PNG, or WebP.';
        } else if (uploadErr.http_code === 401) {
          errorMessage += 'Authentication error. Please check Cloudinary credentials.';
        } else {
          errorMessage += uploadErr.message || 'Please try again.';
        }
        
        return res.status(500).json({ error: errorMessage });
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
        // Ensure slug is properly formatted (sanitize server-side)
        const sanitizedSlug = (a.slug || a.title || '')
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 100);
        
        const r = await query(
          'INSERT INTO articles (title,slug,excerpt,content,featured_image,category_id,author_id,published_at,reading_time,is_featured,is_breaking) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
          [a.title, sanitizedSlug, a.excerpt, a.content, a.featured_image, a.category_id, a.author_id, a.published_at, a.reading_time || 0, a.is_featured || false, a.is_breaking || false]
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
        // Sanitize slug if provided
        if (a.slug) {
          a.slug = a.slug
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 100);
        }
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

    // ===== SHORT LINKS SYSTEM =====
    
    // Generate short code
    function generateShortCode(length = 7): string {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
    
    // Create short link for an article
    if (path === '/api/short-links' && method === 'POST') {
      const { article_id } = req.body || {};
      if (!article_id) return res.status(400).json({ error: 'article_id required' });
      
      // Check if article exists
      const article = await query(
        `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image FROM articles a WHERE a.id = $1`,
        [article_id]
      );
      if (!article.rows.length) return res.status(404).json({ error: 'Article not found' });
      
      // Check if short link already exists for this article
      const existing = await query('SELECT code FROM short_links WHERE article_id = $1', [article_id]);
      if (existing.rows.length) {
        return res.json({ 
          code: existing.rows[0].code,
          short_url: `https://www.mtkenyanews.com/s/${existing.rows[0].code}`,
          created: false
        });
      }
      
      // Generate unique short code
      let code = generateShortCode();
      let attempts = 0;
      while (attempts < 10) {
        const exists = await query('SELECT 1 FROM short_links WHERE code = $1', [code]);
        if (!exists.rows.length) break;
        code = generateShortCode();
        attempts++;
      }
      
      // Create short link
      await query(
        'INSERT INTO short_links (code, article_id) VALUES ($1, $2)',
        [code, article_id]
      );
      
      return res.json({
        code,
        short_url: `https://www.mtkenyanews.com/s/${code}`,
        created: true
      });
    }
    
    // Get short link info
    if (path === '/api/short-links' && method === 'GET') {
      const { article_id } = req.query;
      if (!article_id) return res.status(400).json({ error: 'article_id required' });
      
      const result = await query('SELECT code FROM short_links WHERE article_id = $1', [article_id]);
      if (!result.rows.length) {
        return res.json({ exists: false });
      }
      
      return res.json({
        exists: true,
        code: result.rows[0].code,
        short_url: `https://www.mtkenyanews.com/s/${result.rows[0].code}`
      });
    }
    
    // Create short_links table if needed
    if (path === '/api/init-short-links' && req.query.key === 'mtkenya2025fix') {
      await query(`
        CREATE TABLE IF NOT EXISTS short_links (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(10) UNIQUE NOT NULL,
          article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
          clicks INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await query('CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(code)');
      await query('CREATE INDEX IF NOT EXISTS idx_short_links_article ON short_links(article_id)');
      
      return res.json({ success: true, message: 'Short links table created' });
    }
    
    // ===== POLL LINKS (short links for polls) =====
    
    // Setup poll_links table
    if (path === '/api/init-poll-links' && req.query.key === 'mtkenya2025fix') {
      await query(`
        CREATE TABLE IF NOT EXISTS poll_links (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(10) UNIQUE NOT NULL,
          poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
          clicks INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await query('CREATE INDEX IF NOT EXISTS idx_poll_links_code ON poll_links(code)');
      await query('CREATE INDEX IF NOT EXISTS idx_poll_links_poll ON poll_links(poll_id)');
      
      return res.json({ success: true, message: 'Poll links table created' });
    }
    
    // Create short link for a poll
    if (path === '/api/poll-links' && method === 'POST') {
      const { poll_id } = req.body || {};
      if (!poll_id) return res.status(400).json({ error: 'poll_id required' });
      
      // Check if poll exists
      const poll = await query('SELECT id, title FROM polls WHERE id = $1', [poll_id]);
      if (!poll.rows.length) return res.status(404).json({ error: 'Poll not found' });
      
      // Check if short link already exists for this poll
      const existing = await query('SELECT code FROM poll_links WHERE poll_id = $1', [poll_id]);
      if (existing.rows.length) {
        return res.json({ 
          code: existing.rows[0].code,
          short_url: `https://www.mtkenyanews.com/p/${existing.rows[0].code}`,
          created: false
        });
      }
      
      // Generate unique short code
      let code = generateShortCode();
      let attempts = 0;
      while (attempts < 10) {
        const exists = await query('SELECT 1 FROM poll_links WHERE code = $1', [code]);
        if (!exists.rows.length) break;
        code = generateShortCode();
        attempts++;
      }
      
      // Create short link
      await query(
        'INSERT INTO poll_links (code, poll_id) VALUES ($1, $2)',
        [code, poll_id]
      );
      
      return res.json({
        code,
        short_url: `https://www.mtkenyanews.com/p/${code}`,
        created: true
      });
    }
    
    // Get poll short link info
    if (path === '/api/poll-links' && method === 'GET') {
      const { poll_id } = req.query;
      if (!poll_id) return res.status(400).json({ error: 'poll_id required' });
      
      const result = await query('SELECT code FROM poll_links WHERE poll_id = $1', [poll_id]);
      if (!result.rows.length) {
        return res.json({ exists: false });
      }
      
      return res.json({
        exists: true,
        code: result.rows[0].code,
        short_url: `https://www.mtkenyanews.com/p/${result.rows[0].code}`
      });
    }

    // ===== VOTING POLLS =====
    
    // Setup polls tables (one-time)
    if (path === '/api/setup-polls' && req.query.key === 'mtkenya2025fix') {
      // Create polls table
      await query(`
        CREATE TABLE IF NOT EXISTS polls (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(500) NOT NULL,
          description TEXT,
          type VARCHAR(50) DEFAULT 'voting',
          status VARCHAR(20) DEFAULT 'active',
          start_date TIMESTAMPTZ DEFAULT NOW(),
          end_date TIMESTAMPTZ,
          show_results BOOLEAN DEFAULT true,
          allow_multiple BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      // Create poll options table
      await query(`
        CREATE TABLE IF NOT EXISTS poll_options (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
          title VARCHAR(500) NOT NULL,
          description TEXT,
          image_url TEXT,
          votes_count INTEGER DEFAULT 0,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      // Create poll votes table with unique constraint on phone per poll
      await query(`
        CREATE TABLE IF NOT EXISTS poll_votes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
          option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
          phone_number VARCHAR(20) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(poll_id, phone_number)
        )
      `);
      
      // Create indexes
      await query('CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status)');
      await query('CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id)');
      await query('CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id)');
      await query('CREATE INDEX IF NOT EXISTS idx_poll_votes_phone ON poll_votes(phone_number)');
      
      return res.json({ success: true, message: 'Polls tables created successfully' });
    }
    
    // Get all polls (public - only active)
    if (path === '/api/polls' && method === 'GET') {
      const { status, include_options } = req.query;
      
      let sql = 'SELECT * FROM polls';
      const params: any[] = [];
      
      if (status === 'active') {
        sql += ' WHERE status = $1 AND (end_date IS NULL OR end_date > NOW())';
        params.push('active');
      } else if (status) {
        sql += ' WHERE status = $1';
        params.push(status);
      }
      
      sql += ' ORDER BY created_at DESC';
      
      const polls = await query(sql, params);
      
      // Optionally include options with each poll
      if (include_options === 'true') {
        for (const poll of polls.rows) {
          const options = await query(
            'SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY display_order, created_at',
            [poll.id]
          );
          poll.options = options.rows;
          
          // Calculate total votes
          const totalVotes = options.rows.reduce((sum: number, opt: any) => sum + (opt.votes_count || 0), 0);
          poll.total_votes = totalVotes;
        }
      }
      
      return res.json(polls.rows);
    }
    
    // Get single poll with options
    const pollMatch = path.match(/^\/api\/polls\/([a-f0-9-]+)$/);
    if (pollMatch && method === 'GET') {
      const pollId = pollMatch[1];
      
      const poll = await query('SELECT * FROM polls WHERE id = $1', [pollId]);
      if (!poll.rows.length) return res.status(404).json({ error: 'Poll not found' });
      
      const options = await query(
        'SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY display_order, created_at',
        [pollId]
      );
      
      const totalVotes = options.rows.reduce((sum: number, opt: any) => sum + (opt.votes_count || 0), 0);
      
      return res.json({
        ...poll.rows[0],
        options: options.rows,
        total_votes: totalVotes
      });
    }
    
    // Check if phone has voted
    const checkVoteMatch = path.match(/^\/api\/polls\/([a-f0-9-]+)\/check$/);
    if (checkVoteMatch && method === 'POST') {
      const pollId = checkVoteMatch[1];
      const { phone_number } = req.body;
      
      if (!phone_number) return res.status(400).json({ error: 'Phone number required' });
      
      // Normalize phone number
      const normalizedPhone = phone_number.replace(/\D/g, '').slice(-9);
      
      const existing = await query(
        'SELECT option_id FROM poll_votes WHERE poll_id = $1 AND phone_number LIKE $2',
        [pollId, `%${normalizedPhone}`]
      );
      
      return res.json({
        has_voted: existing.rows.length > 0,
        voted_option: existing.rows[0]?.option_id || null
      });
    }
    
    // Cast a vote
    const voteMatch = path.match(/^\/api\/polls\/([a-f0-9-]+)\/vote$/);
    if (voteMatch && method === 'POST') {
      const pollId = voteMatch[1];
      const { option_id, phone_number } = req.body;
      
      if (!option_id) return res.status(400).json({ error: 'Option ID required' });
      if (!phone_number) return res.status(400).json({ error: 'Phone number required' });
      
      // Validate phone number format (Kenyan format: 07XX or 01XX or +254)
      const cleanPhone = phone_number.replace(/\D/g, '');
      if (cleanPhone.length < 9 || cleanPhone.length > 12) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }
      
      // Normalize to last 9 digits for consistency
      const normalizedPhone = cleanPhone.slice(-9);
      
      // Check if poll is active
      const poll = await query(
        'SELECT status, end_date FROM polls WHERE id = $1',
        [pollId]
      );
      if (!poll.rows.length) return res.status(404).json({ error: 'Poll not found' });
      if (poll.rows[0].status !== 'active') {
        return res.status(400).json({ error: 'This poll is no longer active' });
      }
      if (poll.rows[0].end_date && new Date(poll.rows[0].end_date) < new Date()) {
        return res.status(400).json({ error: 'This poll has ended' });
      }
      
      // Check if option exists
      const option = await query(
        'SELECT id FROM poll_options WHERE id = $1 AND poll_id = $2',
        [option_id, pollId]
      );
      if (!option.rows.length) return res.status(404).json({ error: 'Option not found' });
      
      // Check if already voted (using normalized phone)
      const existing = await query(
        'SELECT id FROM poll_votes WHERE poll_id = $1 AND phone_number LIKE $2',
        [pollId, `%${normalizedPhone}`]
      );
      if (existing.rows.length) {
        return res.status(400).json({ error: 'You have already voted in this poll' });
      }
      
      // Record vote
      await query(
        'INSERT INTO poll_votes (poll_id, option_id, phone_number) VALUES ($1, $2, $3)',
        [pollId, option_id, phone_number]
      );
      
      // Update vote count
      await query(
        'UPDATE poll_options SET votes_count = votes_count + 1 WHERE id = $1',
        [option_id]
      );
      
      // Get updated results
      const options = await query(
        'SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY display_order, created_at',
        [pollId]
      );
      const totalVotes = options.rows.reduce((sum: number, opt: any) => sum + (opt.votes_count || 0), 0);
      
      return res.json({
        success: true,
        message: 'Vote recorded successfully',
        options: options.rows,
        total_votes: totalVotes
      });
    }
    
    // Admin: Create poll
    if (path === '/api/admin/polls' && method === 'POST') {
      if (!checkToken(req)) return res.status(401).json({ error: 'Unauthorized' });
      
      const { title, description, type, end_date, show_results, allow_multiple, options } = req.body;
      
      if (!title) return res.status(400).json({ error: 'Title required' });
      if (!options || !options.length) return res.status(400).json({ error: 'At least one option required' });
      
      // Create poll
      const poll = await query(
        `INSERT INTO polls (title, description, type, end_date, show_results, allow_multiple)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [title, description || null, type || 'voting', end_date || null, show_results !== false, allow_multiple || false]
      );
      
      // Create options
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        await query(
          `INSERT INTO poll_options (poll_id, title, description, image_url, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [poll.rows[0].id, opt.title, opt.description || null, opt.image_url || null, i]
        );
      }
      
      return res.json({ success: true, poll: poll.rows[0] });
    }
    
    // Admin: Get all polls
    if (path === '/api/admin/polls' && method === 'GET') {
      if (!checkToken(req)) return res.status(401).json({ error: 'Unauthorized' });
      
      const polls = await query('SELECT * FROM polls ORDER BY created_at DESC');
      
      for (const poll of polls.rows) {
        const options = await query(
          'SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY display_order',
          [poll.id]
        );
        poll.options = options.rows;
        poll.total_votes = options.rows.reduce((sum: number, opt: any) => sum + (opt.votes_count || 0), 0);
      }
      
      return res.json(polls.rows);
    }
    
    // Admin: Update poll
    const adminPollMatch = path.match(/^\/api\/admin\/polls\/([a-f0-9-]+)$/);
    if (adminPollMatch && method === 'PUT') {
      if (!checkToken(req)) return res.status(401).json({ error: 'Unauthorized' });
      
      const pollId = adminPollMatch[1];
      const { title, description, type, status, end_date, show_results, allow_multiple } = req.body;
      
      await query(
        `UPDATE polls SET title = COALESCE($1, title), description = $2, type = COALESCE($3, type),
         status = COALESCE($4, status), end_date = $5, show_results = COALESCE($6, show_results),
         allow_multiple = COALESCE($7, allow_multiple), updated_at = NOW()
         WHERE id = $8`,
        [title, description, type, status, end_date, show_results, allow_multiple, pollId]
      );
      
      return res.json({ success: true });
    }
    
    // Admin: Delete poll
    if (adminPollMatch && method === 'DELETE') {
      if (!checkToken(req)) return res.status(401).json({ error: 'Unauthorized' });
      
      const pollId = adminPollMatch[1];
      await query('DELETE FROM polls WHERE id = $1', [pollId]);
      
      return res.json({ success: true });
    }
    
    // Admin: Add option to poll
    const addOptionMatch = path.match(/^\/api\/admin\/polls\/([a-f0-9-]+)\/options$/);
    if (addOptionMatch && method === 'POST') {
      if (!checkToken(req)) return res.status(401).json({ error: 'Unauthorized' });
      
      const pollId = addOptionMatch[1];
      const { title, description, image_url } = req.body;
      
      if (!title) return res.status(400).json({ error: 'Option title required' });
      
      // Get max display order
      const maxOrder = await query(
        'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM poll_options WHERE poll_id = $1',
        [pollId]
      );
      
      const option = await query(
        `INSERT INTO poll_options (poll_id, title, description, image_url, display_order)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [pollId, title, description || null, image_url || null, maxOrder.rows[0].next_order]
      );
      
      return res.json({ success: true, option: option.rows[0] });
    }
    
    // Admin: Delete option
    const deleteOptionMatch = path.match(/^\/api\/admin\/polls\/options\/([a-f0-9-]+)$/);
    if (deleteOptionMatch && method === 'DELETE') {
      if (!checkToken(req)) return res.status(401).json({ error: 'Unauthorized' });
      
      const optionId = deleteOptionMatch[1];
      await query('DELETE FROM poll_options WHERE id = $1', [optionId]);
      
      return res.json({ success: true });
    }
    
    // Admin: Get poll votes/analytics
    const pollVotesMatch = path.match(/^\/api\/admin\/polls\/([a-f0-9-]+)\/votes$/);
    if (pollVotesMatch && method === 'GET') {
      if (!checkToken(req)) return res.status(401).json({ error: 'Unauthorized' });
      
      const pollId = pollVotesMatch[1];
      
      const votes = await query(
        `SELECT pv.*, po.title as option_title
         FROM poll_votes pv
         JOIN poll_options po ON pv.option_id = po.id
         WHERE pv.poll_id = $1
         ORDER BY pv.created_at DESC`,
        [pollId]
      );
      
      return res.json(votes.rows);
    }

    // 404
    return res.status(404).json({ error: 'Not found', path });

  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
