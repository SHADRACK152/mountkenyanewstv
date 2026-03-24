import { useEffect, useState } from 'react';
import { Clock, Facebook, Twitter, Mail, Heart, MessageCircle, Eye, Send, AlertCircle, Link2, Check } from 'lucide-react';
import * as api from '../lib/api';
import type { ArticleWithRelations } from '../lib/database.types';

// Use relative URL in production (same origin), or localhost for development
const API = import.meta.env.VITE_API_URL || '';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_name: string;
}

interface ArticlePageProps {
  articleSlug: string;
}

export default function ArticlePage({ articleSlug }: ArticlePageProps) {
  const [article, setArticle] = useState<ArticleWithRelations | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<ArticleWithRelations[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentStatus, setCommentStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const subscriberEmail = localStorage.getItem('subscriber_email');
  const isSubscribed = !!subscriberEmail;

  // All hooks MUST be at the top before any conditional returns
  useEffect(() => {
    fetchArticleData();
  }, [articleSlug]);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const progress = docHeight > 0 ? (scrolled / docHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchArticleData = async () => {
    try {
      const articleData = await api.getArticleBySlug(articleSlug);

      if (articleData) {
        const article = articleData as ArticleWithRelations;
        setArticle(article);

        await api.incrementViews(article.id);

        // Fetch related articles
        const relatedData = await api.getRelatedArticles(article.category_id, article.id, 3);
        if (relatedData) setRelatedArticles(relatedData as ArticleWithRelations[]);

        // Fetch comments
        fetchComments(article.id);

        // Fetch likes
        fetchLikes(article.id);
      } else {
        console.error('Article not found:', articleSlug);
        setArticle(null);
      }
    } catch (err) {
      console.error('Error fetching article:', err);
      setArticle(null);
    }
  };

  const fetchComments = async (articleId: string) => {
    try {
      const res = await fetch(`${API}/api/articles/${articleId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const fetchLikes = async (articleId: string) => {
    try {
      const url = subscriberEmail
        ? `${API}/api/articles/${articleId}/likes?email=${encodeURIComponent(subscriberEmail)}`
        : `${API}/api/articles/${articleId}/likes`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLikeCount(data.count);
        setUserLiked(data.userLiked);
      }
    } catch (err) {
      console.error('Failed to fetch likes:', err);
    }
  };

  const handleLike = async () => {
    if (!article) return;
    
    if (!isSubscribed) {
      window.location.hash = 'subscribe';
      return;
    }

    try {
      const res = await fetch(`${API}/api/articles/${article.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscriberEmail }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserLiked(data.liked);
        setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
      }
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article || !newComment.trim()) return;

    if (!isSubscribed) {
      window.location.hash = 'subscribe';
      return;
    }

    setCommentStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch(`${API}/api/articles/${article.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscriberEmail, content: newComment.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      setCommentStatus('success');
      setNewComment('');
      fetchComments(article.id);
      
      setTimeout(() => setCommentStatus('idle'), 2000);
    } catch (err: any) {
      setCommentStatus('error');
      setErrorMessage(err.message);
    }
  };

  // Generate share URL
  const getShareUrl = () => {
    return `https://www.mtkenyanews.com/#article/${articleSlug}`;
  };

  const shareOnFacebook = () => {
    const url = getShareUrl();
    // Use Facebook's dialog/share which properly shows OG tags
    // Note: Facebook doesn't allow pre-filling text - it reads from OG meta tags
    const shareUrl = `https://www.facebook.com/dialog/share?app_id=966242223397117&href=${encodeURIComponent(url)}&display=popup&redirect_uri=${encodeURIComponent('https://www.mtkenyanews.com/')}`;
    window.open(shareUrl, '_blank', 'width=600,height=500');
  };

  const shareOnTwitter = () => {
    const url = getShareUrl();
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(article?.title || '')}&via=mtkenyanews`, '_blank', 'width=600,height=400');
  };

  const shareByEmail = () => {
    const url = getShareUrl();
    window.location.href = `mailto:?subject=${encodeURIComponent(article?.title || '')}&body=${encodeURIComponent(`Read this article:\n\n${article?.title}\n\n${url}`)}`;
  };

  const shareOnWhatsApp = () => {
    const url = getShareUrl();
    const text = `📰 *${article?.title || ''}*\n\n${article?.excerpt || ''}\n\n👉 Read more: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = getShareUrl();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006633] mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Loading article...</p>
          <p className="text-sm text-gray-500">Slug: <code className="bg-gray-100 px-2 py-1 rounded">{articleSlug}</code></p>
          <p className="text-xs text-gray-400 mt-4">Check browser console (F12) for errors</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCommentDate = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return commentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#006633] to-[#00994d] z-50" style={{ width: `${scrollProgress}%` }}></div>

      {/* Hero Section - Improved Layout */}
      <div className="relative w-full bg-gray-900 pt-[200px] lg:pt-[220px]">
        {/* Featured Image */}
        <div className="relative h-[450px] lg:h-[550px] overflow-hidden bg-gray-800">
          {article.featured_image && (
            <img
              src={article.featured_image}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', article.featured_image);
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          {/* Gradient Overlay - Optimized for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20"></div>

          {/* Top-Right Category & Breaking Badges */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 flex items-center gap-3 z-20">
            {article.is_breaking && (
              <div className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-full animate-pulse flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                Breaking
              </div>
            )}
            {article.categories && (
              <a 
                href={`#category/${article.categories.slug}`}
                className="px-3 py-1.5 bg-[#006633] text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#004d24] transition-colors"
              >
                {article.categories.name}
              </a>
            )}
          </div>

          {/* Article Headline & Metadata - Bottom Aligned */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent px-6 sm:px-8 py-12 sm:py-16">
            <div className="max-w-4xl">
          {/* Eyebrow - Category & Date Inline */}
              <div className="flex flex-wrap items-center gap-3 mb-4 min-w-0">
                {article.categories && (
                  <span className="text-[#00994d] text-xs font-bold uppercase tracking-widest truncate">{article.categories.name}</span>
                )}
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-gray-300 text-xs font-medium truncate">{formatDate(article.published_at)}</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                {article.title}
              </h1>

              {/* Subheading/Excerpt */}
              {article.excerpt && (
                <p className="text-base sm:text-lg text-gray-200 leading-relaxed max-w-3xl">
                  {article.excerpt}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative">
        {/* Floating Social Share Bar */}
        <div className="fixed left-0 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3 p-4 z-40">
          <button 
            onClick={shareOnFacebook} 
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-600 hover:bg-[#006633] hover:text-white transition-all"
            title="Share on Facebook"
          >
            <Facebook size={20} />
          </button>
          <button 
            onClick={shareOnTwitter} 
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-900 hover:bg-[#006633] hover:text-white transition-all"
            title="Share on X/Twitter"
          >
            <Twitter size={20} />
          </button>
          <button 
            onClick={shareOnWhatsApp} 
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-green-500 hover:bg-[#006633] hover:text-white transition-all"
            title="Share on WhatsApp"
          >
            <MessageCircle size={20} />
          </button>
          <button 
            onClick={shareByEmail} 
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:bg-[#006633] hover:text-white transition-all"
            title="Share via Email"
          >
            <Mail size={20} />
          </button>
          <button 
            onClick={copyLink} 
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${linkCopied ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-[#006633] hover:text-white'}`}
            title={linkCopied ? 'Copied!' : 'Copy link'}
          >
            {linkCopied ? <Check size={20} /> : <Link2 size={20} />}
          </button>
        </div>

        {/* Article Container - Single Column */}
        <article className="max-w-2xl mx-auto px-6 sm:px-8 py-16">
          
          {/* Metadata Pill Badge */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12 pb-8 border-b border-gray-200">
            {article.authors && (
              <a 
                href={`#author/${article.author_id}`}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gray-100 rounded-full hover:bg-[#006633]/10 hover:border-[#006633] transition-all group cursor-pointer"
              >
                <img
                  src={article.authors.avatar_url}
                  alt={article.authors.name}
                  className="w-10 h-10 rounded-full group-hover:ring-2 group-hover:ring-[#006633] transition-all"
                />
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 group-hover:text-[#006633] transition-colors">{article.authors.name}</p>
                  <p className="text-gray-600">{formatDate(article.published_at)}</p>
                </div>
              </a>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock size={16} />
                {article.reading_time} min read
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <Eye size={16} />
                {article.views.toLocaleString()} views
              </span>
            </div>
          </div>

          {/* Article Body - Premium Typography */}
          {article.content ? (
            <div 
              className="article-content-premium prose prose-lg max-w-none
                prose-p:font-[400] prose-p:text-[19px] prose-p:leading-8 prose-p:text-gray-800 prose-p:mb-7
                prose-headings:font-serif prose-h2:text-4xl prose-h2:font-bold prose-h2:text-gray-900 prose-h2:mt-12 prose-h2:mb-6
                prose-h3:text-2xl prose-h3:font-bold prose-h3:text-gray-900 prose-h3:mt-10 prose-h3:mb-5
                prose-strong:font-semibold prose-strong:text-gray-900
                prose-em:italic prose-em:text-gray-700
                prose-ul:my-8 prose-ul:space-y-3 prose-ol:my-8 prose-ol:space-y-3
                prose-li:text-[18px] prose-li:text-gray-800 prose-li:leading-relaxed
                prose-blockquote:border-l-4 prose-blockquote:border-[#006633] prose-blockquote:bg-gray-50 prose-blockquote:py-6 prose-blockquote:px-6 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:text-[18px]
                prose-a:text-[#006633] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-lg prose-img:my-10 prose-img:shadow-sm prose-img:max-w-full
                prose-code:bg-gray-100 prose-code:text-red-600 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:break-all
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No content available for this article.</p>
            </div>
          )}

          {/* Author Box - Glasmorphism Style */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            {article.authors && (
              <a 
                href={`#author/${article.author_id}`}
                className="block bg-gradient-to-br from-white to-gray-50 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-gray-200 hover:border-[#006633] hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-6">
                  <img
                    src={article.authors.avatar_url}
                    alt={article.authors.name}
                    className="w-20 h-20 rounded-full border-4 border-[#006633] group-hover:ring-2 group-hover:ring-[#006633] transition-all flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#006633] uppercase tracking-widest mb-2">About Author</p>
                    <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3 group-hover:text-[#006633] transition-colors">{article.authors.name}</h3>
                    <p className="text-gray-700 leading-relaxed">{article.authors.bio}</p>
                  </div>
                </div>
              </a>
            )}
          </div>

          {/* Engagement Buttons - Glassmorphism Cards */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={handleLike}
              className={`backdrop-blur-md rounded-2xl px-6 py-4 font-semibold transition-all text-center border ${
                userLiked 
                  ? 'bg-[#006633]/20 text-[#006633] border-[#006633]' 
                  : 'bg-white/50 text-gray-700 border-gray-200 hover:bg-[#006633]/10 hover:border-[#006633]'
              }`}
            >
              <Heart size={20} className="mx-auto mb-2" fill={userLiked ? 'currentColor' : 'none'} />
              <div className="text-sm">{likeCount}</div>
            </button>
            <button 
              onClick={shareOnFacebook} 
              className="backdrop-blur-md rounded-2xl px-6 py-4 bg-white/50 text-gray-700 border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all"
            >
              <Facebook size={20} className="mx-auto mb-2" />
              <div className="text-sm">Share</div>
            </button>
            <button 
              onClick={shareOnTwitter} 
              className="backdrop-blur-md rounded-2xl px-6 py-4 bg-white/50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all"
            >
              <Twitter size={20} className="mx-auto mb-2" />
              <div className="text-sm">Tweet</div>
            </button>
            <button 
              onClick={copyLink} 
              className={`backdrop-blur-md rounded-2xl px-6 py-4 transition-all border ${linkCopied ? 'bg-green-100 text-green-600 border-green-300' : 'bg-white/50 text-gray-700 border-gray-200 hover:bg-green-50 hover:border-green-200'}`}
            >
              {linkCopied ? <Check size={20} className="mx-auto mb-2" /> : <Link2 size={20} className="mx-auto mb-2" />}
              <div className="text-sm">{linkCopied ? 'Copied' : 'Copy'}</div>
            </button>
          </div>

          {/* Comments Section */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">Conversation ({comments.length})</h2>

            {isSubscribed ? (
              <form onSubmit={handleComment} className="mb-10">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#006633] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {subscriberEmail?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={4}
                      className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#006633] focus:border-transparent resize-none bg-white text-[18px] placeholder-gray-500"
                    />
                    {commentStatus === 'error' && (
                      <div className="flex items-center gap-2 text-red-600 text-sm mt-3">
                        <AlertCircle size={16} />
                        {errorMessage}
                      </div>
                    )}
                    {commentStatus === 'success' && (
                      <div className="text-green-600 text-sm mt-3">✓ Comment posted successfully</div>
                    )}
                    <div className="flex justify-end mt-4">
                      <button
                        type="submit"
                        disabled={commentStatus === 'loading' || !newComment.trim()}
                        className="flex items-center gap-2 px-8 py-3 bg-[#006633] text-white font-semibold rounded-full hover:bg-[#004d24] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send size={18} />
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="backdrop-blur-md bg-white/50 rounded-2xl p-8 text-center border border-gray-200 mb-10">
                <p className="text-gray-700 mb-4 text-lg">Subscribe to join the conversation</p>
                <a
                  href="#subscribe"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#006633] text-white font-semibold rounded-full hover:bg-[#004d24] transition-colors"
                >
                  Subscribe
                </a>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
                      {comment.author_name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{comment.author_name || 'Reader'}</span>
                        <span className="text-sm text-gray-500">{formatCommentDate(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-[18px]">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
                  <p>Be the first to share your thoughts</p>
                </div>
              )}
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-16 pt-12 border-t border-gray-200">
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">Related Reading</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {relatedArticles.slice(0, 2).map((article) => (
                  <a 
                    key={article.id}
                    href={`#article/${article.slug}`}
                    className="group backdrop-blur-md bg-white/70 border border-gray-200 rounded-2xl overflow-hidden hover:border-[#006633] hover:shadow-lg transition-all"
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-300">
                      {article.featured_image && (
                        <img 
                          src={article.featured_image} 
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            console.error('Related article image failed to load:', article.featured_image);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <div className="p-6">
                      {article.categories && (
                        <span className="text-xs font-bold text-[#006633] uppercase tracking-widest">{article.categories.name}</span>
                      )}
                      <h3 className="font-serif text-xl font-bold text-gray-900 mt-3 mb-2 group-hover:text-[#006633] transition-colors">{article.title}</h3>
                      {article.excerpt && (
                        <p className="text-gray-700 text-sm">{article.excerpt}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
