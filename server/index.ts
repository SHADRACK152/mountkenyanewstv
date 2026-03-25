import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('NEON_DATABASE_URL is not set. API cannot start.');
}

const pool = new Pool({ connectionString: DATABASE_URL });

const app = express();
app.use(cors());
app.use(express.json());

// Helper to map DB rows into expected shape (authors, categories nested)
function mapArticleRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    featured_image: row.featured_image,
    category_id: row.category_id,
    author_id: row.author_id,
    published_at: row.published_at,
    reading_time: row.reading_time,
    views: row.views,
    is_featured: row.is_featured,
    is_breaking: row.is_breaking,
    created_at: row.created_at,
    updated_at: row.updated_at,
    categories: {
      id: row.cat_id,
      name: row.cat_name,
      slug: row.cat_slug,
      description: row.cat_description,
    },
    authors: {
      id: row.auth_id,
      name: row.auth_name,
      bio: row.auth_bio,
      avatar_url: row.auth_avatar_url,
      created_at: row.auth_created_at,
    },
  };
}

app.get('/api/articles', async (req, res) => {
  const { slug, category_id, featured, breaking, limit, exclude_id, orderBy, trending } = req.query;

  try {
    const params: any[] = [];
    let whereClauses: string[] = [];

    if (slug) {
      params.push(slug);
      whereClauses.push(`a.slug = $${params.length}`);
    }

    if (category_id) {
      params.push(category_id);
      whereClauses.push(`a.category_id = $${params.length}`);
    }

    if (exclude_id) {
      params.push(exclude_id);
      whereClauses.push(`a.id != $${params.length}`);
    }

    if (featured === 'true') {
      whereClauses.push(`a.is_featured = true`);
    }

    if (breaking === 'true') {
      whereClauses.push(`a.is_breaking = true`);
    }

    let order = 'a.published_at DESC';
    if (trending === 'true') order = 'a.views DESC';
    if (orderBy === 'published_at') order = 'a.published_at DESC';

    let sql = `SELECT a.*, c.id as cat_id, c.name as cat_name, c.slug as cat_slug, c.description as cat_description,
      au.id as auth_id, au.name as auth_name, au.bio as auth_bio, au.avatar_url as auth_avatar_url, au.created_at as auth_created_at
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN authors au ON a.author_id = au.id`;

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ` ORDER BY ${order}`;

    if (limit) {
      sql += ` LIMIT ${Number(limit)}`;
    }

    const { rows } = await pool.query(sql, params);

    const articles = rows.map(mapArticleRow);

    if (slug) {
      return res.json({ data: articles[0] || null });
    }

    res.json({ data: articles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/categories', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/articles/:id/views', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE articles SET views = COALESCE(views, 0) + 1 WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Serve article pages with proper Open Graph meta tags for social media sharing
app.get('/article/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT a.*, c.id as cat_id, c.name as cat_name, c.slug as cat_slug, c.description as cat_description,
        au.id as auth_id, au.name as auth_name, au.bio as auth_bio, au.avatar_url as auth_avatar_url, au.created_at as auth_created_at
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN authors au ON a.author_id = au.id
        WHERE a.slug = $1`,
      [slug]
    );

    const article = rows[0];
    if (!article) {
      return res.status(404).send('Article not found');
    }

    const title = escapeHtml(article.title);
    let description = article.excerpt || '';
    if (!description && article.content) {
      description = article.content.substring(0, 160).replace(/<[^>]*>/g, '');
    }
    if (!description) {
      description = 'Read this article on Mount Kenya News';
    }
    description = escapeHtml(description);
    
    const image = article.featured_image || 'https://www.mtkenyanews.com/mtker.png';
    const pageUrl = `https://www.mtkenyanews.com/#article/${slug}`;
    const canonical = `https://www.mtkenyanews.com/article/${slug}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | Mount Kenya News</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" type="image/png" href="https://www.mtkenyanews.com/mtker.png" />
  <link rel="apple-touch-icon" href="https://www.mtkenyanews.com/mtker.png" />
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:site_name" content="Mount Kenya News" />
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:site" content="@mtkenyanews" />
  <meta name="twitter:creator" content="@mtkenyanews" />
  
  <!-- Other Meta Tags -->
  <meta name="theme-color" content="#006633" />
  
  <script type="text/javascript">
    window.location.href = '/#article/${slug}';
  </script>
</head>
<body>
  <div id="root"></div>
  <noscript>
    <p>Loading article...</p>
  </noscript>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

app.listen(PORT, () => {
  console.log(`Neon API listening on http://localhost:${PORT}`);
});
