import { Clock, Eye, TrendingUp } from 'lucide-react';
import type { ArticleWithRelations } from '../lib/database.types';

interface NewsCardProps {
  article: ArticleWithRelations;
  featured?: boolean;
  horizontal?: boolean;
  compact?: boolean;
  showViews?: boolean;
}

export default function NewsCard({ article, featured = false, horizontal = false, compact = false, showViews = false }: NewsCardProps) {
  const formatDate = (date: string) => {
    const now = new Date();
    const published = new Date(date);
    const diffInHours = Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return published.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (featured) {
    return (
      <a href={`#article/${article.slug}`} className="group block relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500">
        <div className="relative h-[500px] overflow-hidden">
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          {/* Breaking badge */}
          {article.is_breaking && (
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-theme-accent text-white text-xs font-bold uppercase tracking-wider rounded-full animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              Breaking
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <span className="inline-block px-4 py-1.5 bg-theme-primary text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4">
              {article.categories.name}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight group-hover:text-blue-200 transition-colors">
              {article.title}
            </h2>
            <p className="text-gray-200 text-lg mb-5 line-clamp-2 max-w-3xl">{article.excerpt}</p>
            <div className="flex items-center gap-6 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <img src={article.authors.avatar_url} alt={article.authors.name} className="w-8 h-8 rounded-full border-2 border-white/30" />
                <span className="font-semibold text-white">{article.authors.name}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span>{formatDate(article.published_at)}</span>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{article.reading_time} min read</span>
              </div>
              {showViews && article.views > 0 && (
                <>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1">
                    <Eye size={14} />
                    <span>{formatViews(article.views)} views</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </a>
    );
  }

  if (horizontal) {
    return (
      <a href={`#article/${article.slug}`} className="group flex gap-4 p-3 hover:bg-gray-50 rounded-xl transition-all duration-300">
        <div className="relative w-28 h-20 flex-shrink-0 overflow-hidden rounded-lg">
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {article.is_breaking && (
            <div className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-theme-primary uppercase tracking-wider">
            {article.categories.name}
          </span>
          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-theme-primary transition-colors mt-0.5">
            {article.title}
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1.5">
            <span>{formatDate(article.published_at)}</span>
            {showViews && article.views > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Eye size={10} />
                  {formatViews(article.views)}
                </span>
              </>
            )}
          </div>
        </div>
      </a>
    );
  }

  if (compact) {
    return (
      <a href={`#article/${article.slug}`} className="group flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
        <span className="text-2xl font-black text-gray-200 group-hover:text-theme-primary transition-colors">
          {String(article.views || 0).padStart(2, '0').slice(0, 2)}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-theme-primary uppercase tracking-wider">
            {article.categories.name}
          </span>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-theme-primary transition-colors mt-0.5">
            {article.title}
          </h3>
          <span className="text-[11px] text-gray-500 mt-1">{formatDate(article.published_at)}</span>
        </div>
      </a>
    );
  }

  return (
    <a href={`#article/${article.slug}`} className="group block overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-52 overflow-hidden">
        <img
          src={article.featured_image}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Category badge */}
        <span className="absolute top-3 left-3 px-3 py-1 bg-theme-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
          {article.categories.name}
        </span>
        
        {/* Breaking indicator */}
        {article.is_breaking && (
          <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-theme-accent text-white text-[10px] font-bold uppercase rounded-full">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            Live
          </span>
        )}
        
        {/* Trending indicator */}
        {article.is_featured && !article.is_breaking && (
          <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-[10px] font-bold uppercase rounded-full">
            <TrendingUp size={10} />
            Hot
          </span>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-theme-primary transition-colors leading-snug">
          {article.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{article.excerpt}</p>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <img src={article.authors.avatar_url} alt={article.authors.name} className="w-7 h-7 rounded-full" />
            <span className="text-xs font-medium text-gray-700">{article.authors.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{formatDate(article.published_at)}</span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {article.reading_time}m
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
