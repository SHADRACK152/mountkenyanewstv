/**
 * Pre-generate article HTML files with proper meta tags
 * This script runs at build time to create static HTML files for social media crawlers
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});

// Helper to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

async function generateArticlePages() {
  try {
    console.log('🔄 Generating article HTML pages with meta tags...');
    
    // Create articles directory in public
    const articlesDir = path.join(__dirname, '..', 'public', 'articles');
    if (!fs.existsSync(articlesDir)) {
      fs.mkdirSync(articlesDir, { recursive: true });
      console.log(`📁 Created ${articlesDir}`);
    }

    // Fetch all articles
    const result = await pool.query(
      `SELECT a.*, c.name as category_name 
       FROM articles a 
       LEFT JOIN categories c ON a.category_id = c.id 
       ORDER BY a.published_at DESC LIMIT 1000`
    );

    console.log(`📰 Found ${result.rows.length} articles to generate`);

    let count = 0;
    for (const article of result.rows) {
      try {
        const slug = article.slug;
        const title = escapeHtml(article.title);
        const excerpt = escapeHtml(article.excerpt || 'Read this article on Mount Kenya News');
        const image = article.featured_image || 'https://www.mtkenyanews.com/mtker.png';
        const Category = escapeHtml(article.category_name || 'News');

        // Generate HTML with proper Open Graph tags
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Mount Kenya News</title>
  <meta name="description" content="${excerpt}">
  <link rel="canonical" href="https://www.mtkenyanews.com/#article/${slug}">
  
  <!-- Open Graph / Facebook / WhatsApp / Instagram -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://www.mtkenyanews.com/#article/${slug}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${excerpt}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:secure_url" content="${image}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Mount Kenya News">
  <meta property="og:locale" content="en_US">
  <meta property="article:published_time" content="${article.published_at}">
  <meta property="article:section" content="${Category}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@mtkenyanews">
  <meta name="twitter:creator" content="@mtkenyanews">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${excerpt}">
  <meta name="twitter:image" content="${image}">
  <meta name="twitter:domain" content="mtkenyanews.com">
  
  <!-- LinkedIn -->
  <meta property="linkedin:title" content="${title}">
  <meta property="linkedin:description" content="${excerpt}">
  
  <link rel="icon" type="image/png" href="/mtker.png">
  <style>
    * { margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      display: flex; align-items: center; justify-content: center; 
      min-height: 100vh; background: linear-gradient(135deg, #006633 0%, #00994d 100%);
    }
    .container { 
      text-align: center; color: white; padding: 40px 20px; 
      background: rgba(0,0,0,0.2); border-radius: 10px;
    }
    .spinner { 
      width: 60px; height: 60px; 
      border: 4px solid rgba(255,255,255,0.3); 
      border-top-color: white; border-radius: 50%; 
      animation: spin 1s linear infinite; 
      margin: 0 auto 20px; 
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 { font-size: 1.8rem; margin-bottom: 10px; }
    p { opacity: 0.9; margin-bottom: 10px; font-size: 0.95rem; }
    a { color: #fff; text-decoration: underline; font-weight: bold; }
  </style>
  
  <script>
    // Redirect immediately to the article in the SPA
    window.location.href = '/#article/${slug}';
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0; url=/#article/${slug}">
  </noscript>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Loading Article...</h1>
    <p>Redirecting you to the article</p>
    <p><a href="/#article/${slug}">Click here if not redirected</a></p>
  </div>
</body>
</html>`;

        // Write to file (slug.html in articles folder)
        const filePath = path.join(articlesDir, \`\${slug}.html\`);
        fs.writeFileSync(filePath, html, 'utf8');
        count++;

        if (count % 50 === 0) {
          console.log(\`✓ Generated \${count} articles...\`);
        }
      } catch (err) {
        console.error(\`❌ Error generating \${article.slug}:\`, err.message);
      }
    }

    console.log(\`✅ Successfully generated \${count} article pages\`);
    console.log(\`📍 Files saved to: \${articlesDir}\`);
    
  } catch (err) {
    console.error('❌ Generation failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  generateArticlePages().then(() => {
    console.log('Done!');
    process.exit(0);
  });
}

module.exports = { generateArticlePages };
