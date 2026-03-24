import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import * as api from '../lib/api';
import type { ArticleWithRelations } from '../lib/database.types';

export default function BreakingNewsTicker() {
  const [breakingNews, setBreakingNews] = useState<ArticleWithRelations[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check localStorage for visibility preference
    const hidden = localStorage.getItem('breaking_news_hidden');
    if (hidden === 'true') {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    fetchBreakingNews();
  }, []);

  useEffect(() => {
    if (breakingNews.length > 0 && isVisible) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % breakingNews.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [breakingNews, isVisible]);

  const fetchBreakingNews = async () => {
    const data = await api.getBreakingArticles(5);
    if (data) setBreakingNews(data as ArticleWithRelations[]);
  };

  const handleHide = () => {
    setIsVisible(false);
    localStorage.setItem('breaking_news_hidden', 'true');
  };

  if (breakingNews.length === 0 || !isVisible) return null;

  return (
    <div className="bg-red-600 text-white py-2 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 flex-shrink-0 bg-white/20 px-2 py-1 rounded-full">
            <AlertCircle size={14} className="animate-pulse" />
            <span className="font-bold text-xs uppercase tracking-wider">Breaking</span>
          </div>
          <div className="flex-1 overflow-hidden relative h-5">
            {breakingNews.map((article, index) => (
              <a 
                key={article.id}
                href={`#article/${article.slug}`} 
                className={`absolute inset-0 flex items-center hover:underline transition-opacity duration-500 ${
                  index === currentIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span className="text-xs font-medium">{article.title}</span>
              </a>
            ))}
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            {breakingNews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
            <button
              onClick={handleHide}
              className="ml-1 p-1 hover:bg-white/20 rounded-md transition-colors"
              title="Hide breaking news"
              aria-label="Hide breaking news"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
