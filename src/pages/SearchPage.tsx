import { useEffect, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import * as api from '../lib/api';
import type { ArticleWithRelations, Category } from '../lib/database.types';
import NewsCard from '../components/NewsCard';

interface SearchPageProps {
  query: string;
}

export default function SearchPage({ query }: SearchPageProps) {
  const [articles, setArticles] = useState<ArticleWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
    fetchResults();
    fetchCategories();
  }, [query]);

  const fetchResults = async () => {
    setIsLoading(true);
    const data = await api.searchArticles(query);
    if (data) {
      setArticles(data as ArticleWithRelations[]);
    }
    setIsLoading(false);
  };

  const fetchCategories = async () => {
    const cats = await api.getCategories();
    if (cats) setCategories(cats);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.hash = `search/${encodeURIComponent(searchInput.trim())}`;
    }
  };

  // Filter and sort articles
  let filteredArticles = [...articles];
  
  if (selectedCategory) {
    filteredArticles = filteredArticles.filter(a => a.category_id === selectedCategory);
  }

  switch (sortBy) {
    case 'newest':
      filteredArticles.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
      break;
    case 'oldest':
      filteredArticles.sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());
      break;
    case 'popular':
      filteredArticles.sort((a, b) => b.views - a.views);
      break;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[200px] lg:pt-[220px]">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-6">Search Results</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search articles..."
                className="w-full px-5 py-4 pl-12 rounded-xl text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          <p className="mt-4 text-blue-100">
            {isLoading ? 'Searching...' : `Found ${filteredArticles.length} result${filteredArticles.length !== 1 ? 's' : ''} for "${query}"`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 py-4 sticky top-[200px] lg:top-[220px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Popular</option>
            </select>

            {/* Clear Filters */}
            {(selectedCategory || sortBy !== 'newest') && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSortBy('newest');
                }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700"
              >
                <X size={16} />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-5">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Search size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Results Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find any articles matching "{query}".
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="#home"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Go Home
              </a>
              <button
                onClick={() => {
                  setSearchInput('');
                  document.querySelector('input')?.focus();
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Try Another Search
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
