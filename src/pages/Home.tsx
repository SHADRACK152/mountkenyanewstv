import { useEffect, useState } from 'react';
import * as api from '../lib/api';
import type { ArticleWithRelations, Category } from '../lib/database.types';
import NewsCard from '../components/NewsCard';
import TrendingSidebar from '../components/TrendingSidebar';
import AnimatedSection from '../components/AnimatedSection';
import { Mail, TrendingUp, Clock, ChevronRight, Newspaper, Users, Globe, Award } from 'lucide-react';

export default function Home() {
  const [featuredArticles, setFeaturedArticles] = useState<ArticleWithRelations[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<ArticleWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articlesByCategory, setArticlesByCategory] = useState<Record<string, ArticleWithRelations[]>>({});
  const [latestArticles, setLatestArticles] = useState<ArticleWithRelations[]>([]);
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [featuredArticlesRes, trendingArticlesRes, categoriesRes, latestArticlesRes] = await Promise.all([
      api.getFeaturedArticles(5),
      api.getTrendingArticles(10),
      api.getCategories(),
      api.getLatestArticles(12),
    ]);

    if (featuredArticlesRes) setFeaturedArticles(featuredArticlesRes as ArticleWithRelations[]);
    if (trendingArticlesRes) setTrendingArticles(trendingArticlesRes as ArticleWithRelations[]);
    if (categoriesRes) {
      setCategories(categoriesRes);
      fetchArticlesByCategory(categoriesRes);
    }
    if (latestArticlesRes) setLatestArticles(latestArticlesRes as ArticleWithRelations[]);
  };

  const fetchArticlesByCategory = async (cats: Category[]) => {
    const articlesByCat: Record<string, ArticleWithRelations[]> = {};

    for (const category of cats) {
      const data = await api.getArticlesByCategory(category.id, 4);
      if (data && data.length > 0) articlesByCat[category.slug] = data as ArticleWithRelations[];
    }

    setArticlesByCategory(articlesByCat);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribeStatus('loading');
    try {
      // TODO: Implement subscribe API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubscribeStatus('success');
      setEmail('');
    } catch {
      setSubscribeStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section with Featured Articles */}
      <section className="pt-[200px] lg:pt-[220px] pb-8 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="slide-up">
            {featuredArticles.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Featured */}
                <div className="lg:col-span-8">
                  <NewsCard article={featuredArticles[0]} featured showViews />
                </div>
                
                {/* Secondary Featured */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  {featuredArticles.slice(1, 3).map((article) => (
                    <a
                      key={article.id}
                      href={`#article/${article.slug}`}
                      className="group relative flex-1 min-h-[180px] rounded-xl overflow-hidden"
                    >
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <span className="inline-block px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded mb-2">
                          {article.categories.name}
                        </span>
                        <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-blue-200 transition-colors">
                          {article.title}
                        </h3>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Newspaper size={18} className="text-blue-600" />
              <span><strong className="text-gray-900">1,200+</strong> Articles</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users size={18} className="text-blue-600" />
              <span><strong className="text-gray-900">50K+</strong> Readers</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Globe size={18} className="text-blue-600" />
              <span><strong className="text-gray-900">47</strong> Counties Covered</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Award size={18} className="text-blue-600" />
              <span><strong className="text-gray-900">Trusted</strong> Since 2020</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Latest News Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="flex items-center gap-3 text-2xl font-black text-gray-900">
                  <Clock className="text-blue-600" size={24} />
                  Latest News
                </h2>
                <a href="#category/all" className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700">
                  View All <ChevronRight size={16} />
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {latestArticles.slice(0, 4).map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </section>

            {/* Category Sections */}
            {categories.slice(0, 4).map((category) => {
              const articles = articlesByCategory[category.slug];
              if (!articles || articles.length === 0) return null;
              
              return (
                <section key={category.id} className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 border-l-4 border-blue-600 pl-4">
                      {category.name}
                    </h2>
                    <a href={`#category/${category.slug}`} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700">
                      More <ChevronRight size={16} />
                    </a>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Featured article in category */}
                    <div className="md:col-span-2">
                      <NewsCard article={articles[0]} />
                    </div>
                    {/* Other articles */}
                    {articles.slice(1, 3).map((article) => (
                      <NewsCard key={article.id} article={article} horizontal />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* More Latest News */}
            {latestArticles.length > 4 && (
              <section className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-blue-600 pl-4">
                  More Stories
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {latestArticles.slice(4, 10).map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Trending Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-[200px]">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-5">
                <TrendingUp className="text-red-500" size={20} />
                Trending Now
              </h3>
              <div className="space-y-1">
                {trendingArticles.slice(0, 5).map((article, index) => (
                  <a
                    key={article.id}
                    href={`#article/${article.slug}`}
                    className="group flex items-start gap-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-3 px-3 rounded-lg transition-colors"
                  >
                    <span className="text-3xl font-black text-gray-200 group-hover:text-blue-600 transition-colors w-8">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        {article.categories.name}
                      </span>
                      <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mt-1">
                        {article.title}
                      </h4>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-2xl shadow-xl p-6 text-white">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
                <p className="text-blue-200 text-sm">
                  Get breaking news and top stories delivered to your inbox daily.
                </p>
              </div>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={subscribeStatus === 'loading'}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {subscribeStatus === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
                </button>
              </form>
              {subscribeStatus === 'success' && (
                <p className="text-green-300 text-sm text-center mt-3">✓ Successfully subscribed!</p>
              )}
              <p className="text-[11px] text-blue-300 text-center mt-4">
                Join 50,000+ readers. No spam, unsubscribe anytime.
              </p>
            </div>

            {/* Categories List */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <a
                    key={category.id}
                    href={`#category/${category.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-blue-600">{category.name}</span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600" />
                  </a>
                ))}
              </div>
            </div>

            {/* Social Follow */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Follow Us</h3>
              <div className="grid grid-cols-2 gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                  <span className="font-bold">f</span>
                  <span className="text-sm">Facebook</span>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors">
                  <span className="font-bold">𝕏</span>
                  <span className="text-sm">Twitter</span>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:from-purple-700 hover:to-pink-600 transition-colors">
                  <span className="text-sm">Instagram</span>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
                  <span className="text-sm">YouTube</span>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
