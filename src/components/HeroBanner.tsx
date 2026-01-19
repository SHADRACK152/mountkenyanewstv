import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { ArticleWithRelations } from '../lib/database.types';

interface HeroBannerProps {
  articles: ArticleWithRelations[];
}

export default function HeroBanner({ articles }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % articles.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [articles.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % articles.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + articles.length) % articles.length);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (articles.length === 0) return null;

  return (
    <div className="relative h-[500px] md:h-[600px] overflow-hidden rounded-2xl shadow-2xl group">
      {articles.map((article, index) => (
        <div
          key={article.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 animate-slide-up">
            <div className="max-w-4xl">
              <span className="inline-block px-4 py-2 bg-theme-accent text-white text-sm font-bold uppercase tracking-wider rounded-full mb-4 shadow-lg hover:shadow-xl transition-all">
                {article.categories.name}
              </span>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight hover:text-blue-200 transition-colors">
                <a href={`#article/${article.slug}`}>
                  {article.title}
                </a>
              </h1>
              <p className="text-lg md:text-xl text-gray-100 mb-6 line-clamp-2 max-w-3xl">
                {article.excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-200 text-sm md:text-base">
                <div className="flex items-center space-x-2 hover:text-white transition-colors">
                  <img
                    src={article.authors.avatar_url}
                    alt={article.authors.name}
                    className="w-10 h-10 rounded-full border-2 border-white/50 hover:border-white transition-colors"
                  />
                  <span className="font-semibold">{article.authors.name}</span>
                </div>
                <span className="hidden md:inline">•</span>
                <span className="hover:text-blue-200 transition-colors">{formatDate(article.published_at)}</span>
                <span className="hidden md:inline">•</span>
                <div className="flex items-center space-x-2 hover:text-blue-200 transition-colors">
                  <Clock size={16} />
                  <span>{article.reading_time} min read</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {articles.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
