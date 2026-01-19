import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import * as api from '../lib/api';
import type { ArticleWithRelations } from '../lib/database.types';

export default function BreakingNewsTicker() {
  const [breakingNews, setBreakingNews] = useState<ArticleWithRelations[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchBreakingNews();
  }, []);

  useEffect(() => {
    if (breakingNews.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % breakingNews.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [breakingNews]);

  const fetchBreakingNews = async () => {
    const data = await api.getBreakingArticles(5);
    if (data) setBreakingNews(data as ArticleWithRelations[]);
  };

  if (breakingNews.length === 0) return null;

  return (
    <div className="bg-theme-accent text-white py-3 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 flex-shrink-0 bg-white/20 px-3 py-1 rounded-full">
            <AlertCircle size={16} className="animate-pulse" />
            <span className="font-bold text-xs uppercase tracking-wider">Breaking</span>
          </div>
          <div className="flex-1 overflow-hidden relative h-6">
            {breakingNews.map((article, index) => (
              <a 
                key={article.id}
                href={`#article/${article.slug}`} 
                className={`absolute inset-0 flex items-center hover:underline transition-opacity duration-500 ${
                  index === currentIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span className="text-sm font-medium truncate">{article.title}</span>
              </a>
            ))}
          </div>
          <div className="flex-shrink-0 flex items-center gap-1">
            {breakingNews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
