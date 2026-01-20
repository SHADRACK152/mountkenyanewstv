import { useEffect, useState } from 'react';
import { Clock, Calendar, User, ChevronRight, Share2, Facebook, Twitter, Mail, Heart, MessageCircle, Eye, Bookmark, Send, AlertCircle, Link2, Copy, Check } from 'lucide-react';
import * as api from '../lib/api';
import type { ArticleWithRelations } from '../lib/database.types';
import NewsCard from '../components/NewsCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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

  const subscriberEmail = localStorage.getItem('subscriber_email');
  const isSubscribed = !!subscriberEmail;

  useEffect(() => {
    fetchArticleData();
  }, [articleSlug]);

  const fetchArticleData = async () => {
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

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article?.title || '')}`, '_blank');
  };

  const shareByEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(article?.title || '')}&body=${encodeURIComponent(window.location.href)}`;
  };

  const shareOnWhatsApp = () => {
    const text = `${article?.title || ''}\n\nRead more: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const getShortUrl = () => {
    // Return a clean short URL format
    return `https://mtkenyanews.com/#article/${articleSlug}`;
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center pt-[200px] lg:pt-[220px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
    <div className="min-h-screen bg-gray-100 pt-[200px] lg:pt-[220px]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="#home" className="hover:text-blue-600 transition-colors">Home</a>
            <ChevronRight size={14} />
            <a href={`#category/${article.categories.slug}`} className="hover:text-blue-600 transition-colors">
              {article.categories.name}
            </a>
            <ChevronRight size={14} />
            <span className="text-gray-400 truncate max-w-xs">{article.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Article */}
          <article className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Featured Image */}
              <div className="relative">
                <img
                  src={article.featured_image}
                  alt={article.title}
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute top-4 left-4">
                  <a 
                    href={`#category/${article.categories.slug}`}
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-blue-700 transition-colors"
                  >
                    {article.categories.name}
                  </a>
                </div>
                {article.is_breaking && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-full animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    Breaking
                  </div>
                )}
              </div>

              {/* Article Content */}
              <div className="p-6 sm:p-8 lg:p-10">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
                  {article.title}
                </h1>

                <p className="text-xl text-gray-600 mb-6 leading-relaxed font-medium">
                  {article.excerpt}
                </p>

                {/* Author & Meta */}
                <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={article.authors.avatar_url}
                      alt={article.authors.name}
                      className="w-12 h-12 rounded-full border-2 border-gray-100"
                    />
                    <div>
                      <p className="font-bold text-gray-900">{article.authors.name}</p>
                      <p className="text-sm text-gray-500">{formatDate(article.published_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 ml-auto">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {article.reading_time} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {article.views.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Article Body */}
                <div 
                  className="article-content prose prose-lg max-w-none 
                    prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                    prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                    prose-p:text-gray-700 prose-p:leading-8 prose-p:mb-6 prose-p:text-[17px]
                    prose-img:rounded-xl prose-img:mx-auto prose-img:shadow-lg prose-img:my-8
                    prose-a:text-red-600 prose-a:font-medium hover:prose-a:text-red-700
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    prose-ul:my-6 prose-ul:space-y-2 prose-ol:my-6 prose-ol:space-y-2
                    prose-li:text-gray-700 prose-li:leading-7
                    prose-blockquote:border-l-4 prose-blockquote:border-red-500 prose-blockquote:bg-gray-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-gray-700"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />

                {/* Tags & Share */}
                <div className="mt-10 pt-6 border-t border-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Share:</span>
                      <button onClick={shareOnFacebook} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors" title="Share on Facebook">
                        <Facebook size={16} />
                      </button>
                      <button onClick={shareOnTwitter} className="p-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors" title="Share on X/Twitter">
                        <Twitter size={16} />
                      </button>
                      <button onClick={shareOnWhatsApp} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors" title="Share on WhatsApp">
                        <MessageCircle size={16} />
                      </button>
                      <button onClick={shareByEmail} className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors" title="Share via Email">
                        <Mail size={16} />
                      </button>
                      <button 
                        onClick={copyLink} 
                        className={`p-2 rounded-full transition-colors ${linkCopied ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        title={linkCopied ? 'Link copied!' : 'Copy link'}
                      >
                        {linkCopied ? <Check size={16} /> : <Link2 size={16} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                          userLiked 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        <Heart size={16} fill={userLiked ? 'currentColor' : 'none'} />
                        {likeCount}
                      </button>
                      <button className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Bookmark size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Short URL display */}
                  <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Link2 size={16} className="text-gray-400" />
                    <input 
                      type="text" 
                      readOnly 
                      value={getShortUrl()} 
                      className="flex-1 bg-transparent text-sm text-gray-600 outline-none"
                    />
                    <button 
                      onClick={copyLink}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                        linkCopied 
                          ? 'bg-green-500 text-white' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {linkCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Author Box */}
                <div className="mt-8 bg-gray-50 rounded-xl p-6 flex items-start gap-4">
                  <img
                    src={article.authors.avatar_url}
                    alt={article.authors.name}
                    className="w-16 h-16 rounded-full border-2 border-white shadow-md"
                  />
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">About the Author</p>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{article.authors.name}</h3>
                    <p className="text-gray-600 text-sm">{article.authors.bio}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-8 bg-white rounded-2xl shadow-sm p-8">
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
                <MessageCircle size={20} />
                Comments ({comments.length})
              </h3>

              {/* Comment Form */}
              {isSubscribed ? (
                <form onSubmit={handleComment} className="mb-8">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {subscriberEmail?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      {commentStatus === 'error' && (
                        <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                          <AlertCircle size={14} />
                          {errorMessage}
                        </div>
                      )}
                      {commentStatus === 'success' && (
                        <div className="text-green-600 text-sm mt-2">Comment posted successfully!</div>
                      )}
                      <div className="flex justify-end mt-3">
                        <button
                          type="submit"
                          disabled={commentStatus === 'loading' || !newComment.trim()}
                          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send size={16} />
                          {commentStatus === 'loading' ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="mb-8 bg-blue-50 rounded-xl p-6 text-center">
                  <p className="text-gray-700 mb-3">Subscribe to join the conversation</p>
                  <a
                    href="#subscribe"
                    className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Subscribe to Comment
                  </a>
                </div>
              )}

              {/* Comments List */}
              {comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
                        {comment.author_name?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{comment.author_name || 'Anonymous'}</span>
                          <span className="text-sm text-gray-500">{formatCommentDate(comment.created_at)}</span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No comments yet. Be the first to share your thoughts!
                </div>
              )}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-[230px]">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-l-4 border-blue-600 pl-3">
                  Related Articles
                </h3>
                <div className="space-y-4">
                  {relatedArticles.map((relatedArticle) => (
                    <NewsCard key={relatedArticle.id} article={relatedArticle} horizontal />
                  ))}
                </div>
              </div>
            )}

            {/* Subscribe CTA */}
            {!isSubscribed && (
              <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2">Stay Updated</h3>
                <p className="text-blue-200 text-sm mb-4">
                  Get the latest news delivered to your inbox daily.
                </p>
                <a
                  href="#subscribe"
                  className="block w-full text-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                >
                  Subscribe Now
                </a>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
