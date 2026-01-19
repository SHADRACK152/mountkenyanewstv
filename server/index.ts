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

app.listen(PORT, () => {
  console.log(`Neon API listening on http://localhost:${PORT}`);
});
