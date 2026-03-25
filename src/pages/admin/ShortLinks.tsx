import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
}

interface ShortLink {
  code: string;
  short_url: string;
  article_id?: string;
  article_title?: string;
}

export default function ShortLinksAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<Map<string, ShortLink>>(new Map());
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?limit=1000');
      const data = await response.json();
      setArticles(data);

      // Fetch existing short links for all articles
      const linkMap = new Map();
      for (const article of data) {
        try {
          const linkRes = await fetch(`/api/short-links?article_id=${article.id}`);
          const linkData = await linkRes.json();
          if (linkData.code) {
            linkMap.set(article.id, linkData);
          }
        } catch {
          // No short link for this article
        }
      }
      setSelectedArticles(linkMap);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    }
  };

  const createShortLink = async (articleId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/short-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      });
      const data = await response.json();
      
      const article = articles.find(a => a.id === articleId);
      setSelectedArticles(new Map(selectedArticles).set(articleId, {
        ...data,
        article_title: article?.title,
      }));
    } catch (err) {
      console.error('Failed to create short link:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Short Links</h1>
        <p className="text-gray-600 mt-2">Create and manage short links for articles with proper social media previews</p>
      </div>

      <div className="grid gap-4">
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No articles found</p>
          </div>
        ) : (
          articles.map((article) => {
            const shortLink = selectedArticles.get(article.id);
            return (
              <div key={article.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{article.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">ID: {article.id}</p>
                    
                    {shortLink ? (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm font-semibold text-green-900 mb-2">Short Link Created</p>
                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-green-300">
                          <code className="flex-1 text-sm text-gray-700">{shortLink.short_url}</code>
                          <button
                            onClick={() => copyToClipboard(shortLink.short_url)}
                            className="p-1 hover:bg-gray-100 rounded transition"
                          >
                            {copied === shortLink.short_url ? (
                              <Check size={16} className="text-green-600" />
                            ) : (
                              <Copy size={16} className="text-gray-600" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-green-700 mt-2">
                          Code: <code className="font-mono">{shortLink.code}</code>
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <p className="text-sm text-gray-500 mb-2">No short link created yet</p>
                      </div>
                    )}
                  </div>

                  {!shortLink && (
                    <button
                      onClick={() => createShortLink(article.id)}
                      disabled={loading}
                      className="ml-4 px-4 py-2 bg-[#006633] text-white rounded font-semibold hover:bg-[#004d24] disabled:opacity-50 transition"
                    >
                      {loading ? 'Creating...' : 'Create Short Link'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
