import { useEffect, useState } from 'react';
import * as api from '../lib/api';
import type { ArticleWithRelations, Category } from '../lib/database.types';
import { Mail, TrendingUp, Clock, ChevronRight, Play, Radio, Search } from 'lucide-react';
import VotingPoll from '../components/VotingPoll';

export default function Home() {
  const [featuredArticles, setFeaturedArticles] = useState<ArticleWithRelations[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<ArticleWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [latestArticles, setLatestArticles] = useState<ArticleWithRelations[]>([]);
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (categoriesRes) setCategories(categoriesRes);
    if (latestArticlesRes) setLatestArticles(latestArticlesRes as ArticleWithRelations[]);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribeStatus('loading');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubscribeStatus('success');
      setEmail('');
      setTimeout(() => setSubscribeStatus('idle'), 3000);
    } catch {
      setSubscribeStatus('error');
    }
  };

  // Auto-slide every 8 seconds
  useEffect(() => {
    if (featuredArticles.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredArticles.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featuredArticles.length]);

  const currentArticle = featuredArticles[currentSlide];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-screen">
      {/* TOP BAR - Live TV, Radio, Search */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Live TV & Radio */}
            <div className="flex items-center gap-4">
              <a href="#" className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm">
                <Play size={16} fill="currentColor" />
                Live TV
              </a>
              <a href="#" className="flex items-center gap-2 px-4 py-2 bg-[#006633] text-white rounded-lg hover:bg-[#004d24] transition-colors font-semibold text-sm">
                <Radio size={16} />
                Live Radio
              </a>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-300 focus-within:border-[#006633] transition-colors">
                <Search size={18} className="text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search news..."
                  className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-500 text-sm"
                />
              </div>
            </div>

            {/* Subscribe Button */}
            <a href="#subscribe" className="px-4 py-2 bg-[#006633] text-white rounded-lg hover:bg-[#004d24] transition-colors font-semibold text-sm">
              Subscribe
            </a>
          </div>
        </div>
      </div>

      {/* FEATURED HEADLINE */}
      {currentArticle && (
        <section className="bg-white border-b border-gray-200 pt-6">
          <div className="max-w-7xl mx-auto px-3 md:px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Featured Image */}
              <div className="order-2 lg:order-1">
                <img
                  src={currentArticle.featured_image}
                  alt={currentArticle.title}
                  className="w-full h-auto rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Featured Content */}
              <div className="order-1 lg:order-2">
                {currentArticle.categories && (
                  <a
                    href={`#category/${currentArticle.categories.slug}`}
                    className="inline-block px-4 py-2 bg-[#006633] text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#004d24] transition-colors mb-4"
                  >
                    {currentArticle.categories.name}
                  </a>
                )}
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4 font-serif">
                  <a href={`#article/${currentArticle.slug}`} className="hover:text-[#006633] transition-colors">
                    {currentArticle.title}
                  </a>
                </h1>

                {/* Author & Date */}
                {currentArticle.authors && (
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                    <img
                      src={currentArticle.authors.avatar_url}
                      alt={currentArticle.authors.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <a href={`#author/${currentArticle.author_id}`} className="font-semibold text-gray-900 hover:text-[#006633]">
                        {currentArticle.authors.name}
                      </a>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(currentArticle.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Read More Button */}
                <a
                  href={`#article/${currentArticle.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#006633] text-white rounded-lg hover:bg-[#004d24] transition-colors font-semibold"
                >
                  Read Full Story
                  <ChevronRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN COLUMN */}
          <main className="lg:col-span-2 space-y-12">
            {/* Trending Now */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="text-[#006633]" size={24} />
                <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {trendingArticles.slice(0, 5).map((article, idx) => (
                  <a
                    key={article.id}
                    href={`#article/${article.slug}`}
                    className="flex items-center gap-4 p-6 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-4xl font-black text-gray-300 group-hover:text-[#006633] transition-colors w-12">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#006633] uppercase tracking-wide mb-1">
                        {article.categories?.name}
                      </p>
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#006633] transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-2">
                        {new Date(article.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* Latest Stories Grid */}
            {latestArticles.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Stories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {latestArticles.slice(0, 6).map((article) => (
                    <a
                      key={article.id}
                      href={`#article/${article.slug}`}
                      className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {article.featured_image && (
                        <div className="h-40 overflow-hidden bg-gray-200">
                          <img
                            src={article.featured_image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <p className="text-xs font-bold text-[#006633] uppercase tracking-wide mb-2">
                          {article.categories?.name}
                        </p>
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#006633] transition-colors line-clamp-2 mb-3">
                          {article.title}
                        </h3>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(article.published_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* More Stories */}
            {latestArticles.length > 6 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">More Stories</h2>
                <div className="space-y-6">
                  {latestArticles.slice(6).map((article) => (
                    <a
                      key={article.id}
                      href={`#article/${article.slug}`}
                      className="flex gap-4 group"
                    >
                      {article.featured_image && (
                        <div className="w-32 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={article.featured_image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#006633] uppercase tracking-wide mb-1">
                          {article.categories?.name}
                        </p>
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#006633] transition-colors line-clamp-2 mb-2">
                          {article.title}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {new Date(article.published_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* SIDEBAR */}
          <aside className="lg:col-span-1 space-y-8">
            {/* Voting Poll */}
            <VotingPoll />

            {/* Newsletter Signup */}
            <div id="subscribe" className="bg-gradient-to-br from-[#006633] to-[#004d24] rounded-lg p-6 text-white">
              <div className="mb-4">
                <Mail size={28} className="mb-3" />
                <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
                <p className="text-sm text-green-100">
                  Get breaking news and top stories delivered to your inbox.
                </p>
              </div>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={subscribeStatus === 'loading'}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {subscribeStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
              {subscribeStatus === 'success' && (
                <p className="text-green-300 text-xs text-center mt-3">✓ Successfully subscribed!</p>
              )}
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.slice(0, 8).map((category) => (
                    <a
                      key={category.id}
                      href={`#category/${category.slug}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <span className="font-medium text-gray-700 group-hover:text-[#006633]">
                        {category.name}
                      </span>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-[#006633]" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
