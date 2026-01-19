import { TrendingUp } from 'lucide-react';
import NewsCard from './NewsCard';
import type { ArticleWithRelations } from '../lib/database.types';

interface TrendingSidebarProps {
  articles: ArticleWithRelations[];
}

export default function TrendingSidebar({ articles }: TrendingSidebarProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
      <div className="flex items-center space-x-2 mb-6 pb-4 border-b-2 border-theme-primary">
        <TrendingUp size={24} className="text-theme-primary" />
        <h3 className="text-2xl font-bold text-gray-900">Trending Now</h3>
      </div>
      <div className="space-y-4">
        {articles.map((article, index) => (
          <div key={article.id} className="flex space-x-3">
            <span className="text-3xl font-bold text-theme-primary opacity-20 flex-shrink-0">
              {(index + 1).toString().padStart(2, '0')}
            </span>
            <div className="flex-1">
              <NewsCard article={article} horizontal />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
