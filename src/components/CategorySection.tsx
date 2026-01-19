import { ChevronRight } from 'lucide-react';
import NewsCard from './NewsCard';
import type { ArticleWithRelations } from '../lib/database.types';

interface CategorySectionProps {
  title: string;
  articles: ArticleWithRelations[];
  categorySlug: string;
}

export default function CategorySection({ title, articles, categorySlug }: CategorySectionProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900 border-l-4 border-theme-primary pl-4">
          {title}
        </h2>
        <a
          href={`#category/${categorySlug}`}
          className="flex items-center space-x-1 text-theme-primary hover:text-theme-primary-dark font-semibold transition-colors group"
        >
          <span>View All</span>
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.slice(0, 3).map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
