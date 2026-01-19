import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as api from '../lib/api';
import type { ArticleWithRelations, Category } from '../lib/database.types';
import NewsCard from '../components/NewsCard';

interface CategoryPageProps {
  categorySlug: string;
}

export default function CategoryPage({ categorySlug }: CategoryPageProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<ArticleWithRelations[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<ArticleWithRelations | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 9;

  useEffect(() => {
    fetchCategoryData();
  }, [categorySlug]);

  const fetchCategoryData = async () => {
    const categoryData = await api.getCategories().then((cats) => (cats || []).find((c: any) => c.slug === categorySlug));

    if (categoryData) {
      setCategory(categoryData);

      const articlesData = await api.getArticlesByCategory((categoryData as any).id, 1000);

      if (articlesData && articlesData.length > 0) {
        setFeaturedArticle(articlesData[0] as ArticleWithRelations);
        setArticles(articlesData.slice(1) as ArticleWithRelations[]);
      }
    }
  };

  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const currentArticles = articles.slice(startIndex, startIndex + articlesPerPage);

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-[200px] lg:pt-[220px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[200px] lg:pt-[220px]">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 mb-4">
            <a href="#home" className="hover:underline">Home</a>
            <ChevronRight size={16} />
            <span>{category.name}</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">{category.name}</h1>
          <p className="text-xl text-blue-100 max-w-3xl">{category.description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {featuredArticle && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-blue-600 pl-4">
              Featured Story
            </h2>
            <NewsCard article={featuredArticle} featured />
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-blue-600 pl-4">
            Recent Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-12">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
