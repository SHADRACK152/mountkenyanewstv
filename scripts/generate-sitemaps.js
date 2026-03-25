import fs from 'fs/promises';
import { Pool } from 'pg';

async function main() {
  try {
    const dbUrl = process.env.NEON_DATABASE_URL;
    const baseUrl = process.env.SITE_URL || 'https://www.mtkenyanews.com';

    if (!dbUrl) {
      console.error('NEON_DATABASE_URL is not set');
      process.exit(1);
    }

    console.log('Connecting to database...');
    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: true } });

    // Fetch articles
    console.log('Querying articles...');
    const aRes = await pool.query(
      `SELECT slug, COALESCE(updated_at, published_at, created_at) AS lastmod FROM articles WHERE published_at IS NOT NULL ORDER BY published_at DESC`
    );
    const articles = aRes.rows || [];
    console.log(`Found ${articles.length} articles`);

    // Fetch categories
    console.log('Querying categories...');
    const cRes = await pool.query('SELECT slug, COALESCE(created_at, NOW()) AS lastmod FROM categories');
    const categories = cRes.rows || [];
    console.log(`Found ${categories.length} categories`);

    // Fetch active polls
    console.log('Querying active polls...');
    const pRes = await pool.query("SELECT id, COALESCE(updated_at, created_at) AS lastmod FROM polls WHERE status='active'");
    const polls = pRes.rows || [];
    console.log(`Found ${polls.length} active polls`);

    await fs.mkdir('public', { recursive: true });

    const toUrl = (loc, lastmod) => ({ loc, lastmod: lastmod ? new Date(lastmod).toISOString().split('T')[0] : null });

    const articleUrls = articles.map((r) => toUrl(`${baseUrl}/article/${encodeURIComponent(r.slug)}`, r.lastmod));
    const categoryUrls = categories.map((c) => toUrl(`${baseUrl}/#category/${encodeURIComponent(c.slug)}`, c.lastmod));
    const pollUrls = polls.map((p) => toUrl(`${baseUrl}/p/${encodeURIComponent(p.id)}`, p.lastmod));

    const staticPages = [
      toUrl(`${baseUrl}/`, null),
      toUrl(`${baseUrl}/#about`, null),
      toUrl(`${baseUrl}/#contact`, null),
      toUrl(`${baseUrl}/#careers`, null),
      toUrl(`${baseUrl}/#polls`, null),
      toUrl(`${baseUrl}/#privacy`, null),
      toUrl(`${baseUrl}/#terms`, null),
    ];

    const writeUrlset = async (filePath, urls) => {
      console.log(`Writing ${filePath} (${urls.length} urls)`);
      const header = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      const footer = '</urlset>';
      const body = urls
        .map((u) => {
          const last = u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : '';
          const priority = u.loc.includes('/article/') ? '0.9' : u.loc.includes('/p/') ? '0.7' : '0.9';
          return `  <url>\n    <loc>${u.loc}</loc>${last}\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
        })
        .join('\n');
      await fs.writeFile(filePath, header + body + '\n' + footer, 'utf8');
    };

    // split articles into 3 files
    const chunks = [[], [], []];
    articleUrls.forEach((u, i) => chunks[i % 3].push(u));

    await writeUrlset('public/sitemap-articles-1.xml', chunks[0]);
    await writeUrlset('public/sitemap-articles-2.xml', chunks[1]);
    await writeUrlset('public/sitemap-articles-3.xml', chunks[2]);

    await writeUrlset('public/sitemap-categories.xml', categoryUrls);
    await writeUrlset('public/sitemap-polls.xml', pollUrls);
    await writeUrlset('public/sitemap-pages.xml', staticPages);

    // sitemap index
    const sitemaps = [
      'sitemap-pages.xml',
      'sitemap-categories.xml',
      'sitemap-polls.xml',
      'sitemap-articles-1.xml',
      'sitemap-articles-2.xml',
      'sitemap-articles-3.xml',
    ];
    const now = new Date().toISOString().split('T')[0];
    const indexHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    const indexFooter = '</sitemapindex>';
    const indexBody = sitemaps.map((s) => `  <sitemap>\n    <loc>${baseUrl}/${s}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`).join('\n');
    console.log('\nSitemap URLs generated:');
    console.log(`- Articles: ${articleUrls.length} URLs`);
    console.log(`- Categories: ${categoryUrls.length} URLs`);
    console.log(`- Polls: ${pollUrls.length} URLs`);
    console.log(`- Static pages: ${staticPages.length} URLs`);
    await fs.writeFile('public/sitemap-index.xml', indexHeader + indexBody + '\n' + indexFooter, 'utf8');

    console.log('Sitemap generation complete. Files written to public/');
    await pool.end();
  } catch (err) {
    console.error('Sitemap generation failed:', err);
    process.exit(1);
  }
}

main();
