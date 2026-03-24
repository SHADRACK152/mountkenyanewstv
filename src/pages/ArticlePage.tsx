import { useEffect, useState } from 'react';
import { Clock, Facebook, Twitter, Mail, Heart, MessageCircle, Eye, Send, AlertCircle, Link2, Check, Tag, Share2 } from 'lucide-react';
import * as api from '../lib/api';
import type { ArticleWithRelations } from '../lib/database.types';

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
  const [trendingArticles, setTrendingArticles] = useState<ArticleWithRelations[]>([]);
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
        
        const relatedData = await api.getRelatedArticles(article.category_id, article.id, 6);
        if (relatedData) setRelatedArticles(relatedData as ArticleWithRelations[]);

        const trendingData = await api.getTrendingArticles(5);
        if (trendingData) setTrendingArticles(trendingData as ArticleWithRelations[]);

        fetchComments(article.id);
        fetchLikes(article.id);
      } else {
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

  const getShareUrl = () => {
    return `https://www.mtkenyanews.com/#article/${articleSlug}`;
  };

  const shareOnFacebook = () => {
    const url = getShareUrl();
    window.open(`https://www.facebook.com/dialog/share?app_id=966242223397117&href=${encodeURIComponent(url)}&display=popup`, '_blank', 'width=600,height=500');
  };

  const shareOnTwitter = () => {
    const url = getShareUrl();
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(article?.title || '')}&via=mtkenyanews`, '_blank', 'width=600,height=400');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
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
      <div className="min-h-screen bg-white flex items-center justify-center pt-40">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006633] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#006633] to-[#00994d] z-50" style={{ width: `${scrollProgress}%` }}></div>

      {/* Main Container */}
      <div className="w-full mx-auto px-3 md:px-4 py-4 pt-20">
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
          {/* Main Content */}
          <main className="w-full lg:w-2/3 min-w-0">
            {/* Category Badge */}
            {article.categories && (
              <a 
                href={`#category/${article.categories.slug}`}
                className="inline-block px-4 py-2 bg-[#006633] text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#004d24] transition-colors mb-6"
              >
                {article.categories.name}
              </a>
            )}

            {/* Article Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6 font-serif">
              {article.title}
            </h1>

            {/* Author Info */}
            <div className="flex items-center justify-between py-4 border-y border-gray-300 mb-6">
              <div className="flex items-center gap-4">
                {article.authors && (
                  <>
                    <img
                      src={article.authors.avatar_url}
                      alt={article.authors.name}
                      className="w-12 h-12 rounded-full border-2 border-[#006633]"
                    />
                    <div>
                      <p className="text-sm text-gray-600">By</p>
                      <a 
                        href={`#author/${article.author_id}`}
                        className="font-semibold text-gray-900 hover:text-[#006633] transition-colors"
                      >
                        {article.authors.name}
                      </a>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  {formatDate(article.published_at)}
                </span>
              </div>
            </div>

            {/* Featured Image */}
            {article.featured_image && (
              <div className="mb-8 rounded-lg overflow-hidden bg-gray-200">
                <img
                  src={article.featured_image}
                  alt={article.title}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Article Content */}
            <div className="w-full overflow-hidden">
              <article 
                className="prose prose-sm md:prose-base lg:prose-lg w-full max-w-full mb-12
                  prose-headings:font-serif prose-headings:font-bold prose-headings:text-gray-900 prose-headings:w-full prose-headings:break-words
                  prose-h1:text-2xl md:prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
                  prose-h2:text-xl md:prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3
                  prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                  prose-p:text-gray-700 prose-p:leading-8 prose-p:mb-6 prose-p:text-left prose-p:break-words prose-p:w-full
                  prose-strong:text-gray-900 prose-strong:font-bold
                  prose-em:text-gray-800
                  prose-blockquote:border-l-4 prose-blockquote:border-[#006633] prose-blockquote:bg-[#006633]/5 prose-blockquote:py-4 prose-blockquote:px-4 prose-blockquote:italic prose-blockquote:w-full prose-blockquote:break-words
                  prose-a:text-[#006633] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-a:break-all
                  prose-img:rounded-lg prose-img:my-8 prose-img:w-full prose-img:max-w-full prose-img:h-auto
                  prose-ul:my-6 prose-ul:space-y-3 prose-ul:w-full prose-ol:my-6 prose-ol:space-y-3 prose-ol:w-full
                  prose-li:text-gray-700 prose-li:leading-relaxed prose-li:break-words
                  prose-code:bg-gray-100 prose-code:text-[#006633] prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:break-all
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:w-full
                  prose-hr:my-8 prose-hr:border-gray-300"
                dangerouslySetInnerHTML={{ __html: article.content || '<p>No content available.</p>' }}
              />
            </div>

            {/* Share & Like Section */}
            <div className="bg-gray-100 rounded-lg p-6 mb-12 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    userLiked 
                      ? 'bg-[#006633] text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Heart size={18} fill={userLiked ? 'currentColor' : 'none'} />
                  <span>{likeCount}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={shareOnFacebook} className="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="Share on Facebook">
                  <Facebook size={20} className="text-blue-600" />
                </button>
                <button onClick={shareOnTwitter} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Share on Twitter">
                  <Twitter size={20} className="text-gray-900" />
                </button>
                <button onClick={copyLink} className={`p-2 rounded-lg transition-colors ${linkCopied ? 'bg-green-100' : 'hover:bg-gray-200'}`} title={linkCopied ? 'Copied!' : 'Copy link'}>
                  {linkCopied ? <Check size={20} className="text-green-600" /> : <Link2 size={20} className="text-gray-700" />}
                </button>
              </div>
            </div>

            {/* Tags */}
            {article.categories && (
              <div className="mb-12">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm">
                    <Tag size={14} />
                    {article.categories.name}
                  </span>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t border-gray-300 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 font-serif">Leave a Comment ({comments.length})</h2>

              {isSubscribed ? (
                <form onSubmit={handleComment} className="mb-10">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Your Comment"
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006633] focus:border-transparent resize-none text-base"
                  />
                  {commentStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600 text-sm mt-3">
                      <AlertCircle size={16} />
                      {errorMessage}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={commentStatus === 'loading' || !newComment.trim()}
                    className="mt-4 flex items-center gap-2 px-6 py-3 bg-[#006633] text-white font-semibold rounded-lg hover:bg-[#004d24] disabled:opacity-50 transition-colors"
                  >
                    <Send size={18} />
                    Submit
                  </button>
                </form>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center mb-10">
                  <p className="text-gray-700 mb-4">Subscribe to join the conversation</p>
                  <a href="#subscribe" className="inline-block px-6 py-3 bg-[#006633] text-white font-semibold rounded-lg hover:bg-[#004d24]">
                    Subscribe
                  </a>
                </div>
              )}

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-900 mb-1">{comment.author_name}</p>
                    <p className="text-xs text-gray-600 mb-3">{new Date(comment.created_at).toLocaleDateString()}</p>
                    <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Sidebar - Right Column */}
          <aside className="w-full lg:w-1/3 min-w-0">
            {/* Trending Now */}
            {trendingArticles.length > 0 && (
              <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6 font-serif">Trending Now</h3>
                <div className="space-y-4">
                  {trendingArticles.slice(0, 4).map((article, idx) => (
                    <a
                      key={article.id}
                      href={`#article/${article.slug}`}
                      className="flex gap-3 pb-4 border-b border-gray-200 last:border-b-0 hover:opacity-75 transition-opacity group"
                    >
                      <span className="text-2xl font-bold text-[#006633] flex-shrink-0">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 group-hover:text-[#006633] text-sm leading-tight line-clamp-2">
                          {article.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">{article.category_id}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Stories */}
            {relatedArticles.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6 font-serif">Latest Stories</h3>
                <div className="space-y-4">
                  {relatedArticles.slice(0, 4).map((article) => (
                    <a
                      key={article.id}
                      href={`#article/${article.slug}`}
                      className="group hover:opacity-75 transition-opacity"
                    >
                      {article.featured_image && (
                        <div className="mb-2 h-32 overflow-hidden rounded-lg bg-gray-300">
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
                      <h4 className="font-semibold text-gray-900 group-hover:text-[#006633] text-sm leading-tight line-clamp-2">
                        {article.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-2">
                        {new Date(article.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
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
