import { useEffect, useState, useRef } from 'react';
import { Clock, Facebook, Twitter, Mail, Heart, MessageCircle, Eye, Send, AlertCircle, Link2, Check, Menu, X } from 'lucide-react';
import * as api from '../lib/api';
import type { ArticleWithRelations } from '../lib/database.types';

const API = import.meta.env.VITE_API_URL || '';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_name: string;
}

interface Heading {
  id: string;
  text: string;
  level: number; // 1 for h1, 2 for h2
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
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [showTOC, setShowTOC] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

      // Update active heading
      if (contentRef.current) {
        const elements = contentRef.current.querySelectorAll('h1, h2');
        let activeId = '';
        elements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < 100) {
            activeId = el.id;
          }
        });
        setActiveHeading(activeId);
      }
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
        const relatedData = await api.getRelatedArticles(article.category_id, article.id, 3);
        if (relatedData) setRelatedArticles(relatedData as ArticleWithRelations[]);

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

  useEffect(() => {
    if (article && contentRef.current) {
      const timer = setTimeout(() => {
        const h1s = contentRef.current?.querySelectorAll('h1') || [];
        const h2s = contentRef.current?.querySelectorAll('h2') || [];
        const headingsList: Heading[] = [];

        h1s.forEach((h1, i) => {
          const id = h1.id || `h1-${i}`;
          h1.id = id;
          headingsList.push({ id, text: h1.textContent || '', level: 1 });
        });

        h2s.forEach((h2, i) => {
          const id = h2.id || `h2-${i}`;
          h2.id = id;
          headingsList.push({ id, text: h2.textContent || '', level: 2 });
        });

        setHeadings(headingsList);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [article]);

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
    const text = `ðŸ“° *${article?.title || ''}*\n\n${article?.excerpt || ''}\n\nðŸ‘‰ Read more: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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
        <div className="text-center p-6">
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
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#006633] to-[#00994d] z-50" style={{ width: `${scrollProgress}%` }}></div>

      {/* Hero Section */}
      <div className="relative w-full bg-gray-900 pt-[200px] lg:pt-[220px]">
        <div className="relative h-[400px] md:h-[500px] overflow-hidden bg-gray-800">
          {article.featured_image && (
            <img
              src={article.featured_image}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20"></div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent px-6 md:px-8 py-8 md:py-12">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {article.categories && (
                  <span className="text-[#00994d] text-xs font-bold uppercase tracking-widest">{article.categories.name}</span>
                )}
                <span className="text-gray-400 text-xs">â€¢</span>
                <span className="text-gray-300 text-xs font-medium">{formatDate(article.published_at)}</span>
              </div>

              <h1 className="font-serif text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="text-base md:text-lg text-gray-200 leading-relaxed">
                  {article.excerpt}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="relative">
        {/* Floating Social Bar */}
        <div className="fixed left-0 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3 p-4 z-40">
          <button onClick={shareOnFacebook} className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-600 hover:bg-[#006633] hover:text-white transition-all" title="Share on Facebook">
            <Facebook size={20} />
          </button>
          <button onClick={shareOnTwitter} className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-900 hover:bg-[#006633] hover:text-white transition-all" title="Share on Twitter">
            <Twitter size={20} />
          </button>
          <button onClick={shareOnWhatsApp} className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-green-500 hover:bg-[#006633] hover:text-white transition-all" title="Share on WhatsApp">
            <MessageCircle size={20} />
          </button>
          <button onClick={copyLink} className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${linkCopied ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-[#006633] hover:text-white'}`} title={linkCopied ? 'Copied!' : 'Copy link'}>
            {linkCopied ? <Check size={20} /> : <Link2 size={20} />}
          </button>
        </div>

        <div className="flex gap-8 max-w-6xl mx-auto px-6 md:px-8 py-12">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Author Badge */}
            <div className="mb-12">
              {article.authors && (
                <a 
                  href={`#author/${article.author_id}`}
                  className="inline-flex items-center gap-4 px-6 py-4 bg-gray-50 rounded-xl hover:bg-[#006633]/5 transition-all group"
                >
                  <img
                    src={article.authors.avatar_url}
                    alt={article.authors.name}
                    className="w-14 h-14 rounded-full border-2 border-[#006633]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#006633] uppercase tracking-widest">By</p>
                    <p className="font-semibold text-gray-900 group-hover:text-[#006633]">{article.authors.name}</p>
                  </div>
                </a>
              )}
            </div>

            {/* Article Content */}
            <article 
              ref={contentRef}
              className="prose prose-sm md:prose-base lg:prose-lg w-full max-w-full overflow-hidden
                prose-headings:font-serif prose-headings:font-bold prose-headings:text-gray-900
                prose-h1:text-2xl md:prose-h1:text-3xl lg:prose-h1:text-4xl prose-h1:mt-10 prose-h1:mb-6
                prose-h2:text-xl md:prose-h2:text-2xl lg:prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
                prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-gray-700 prose-p:leading-8 prose-p:mb-6 prose-p:text-left prose-p:break-words
                prose-strong:text-gray-900 prose-strong:font-bold
                prose-em:text-gray-800
                prose-blockquote:border-l-4 prose-blockquote:border-[#006633] prose-blockquote:bg-[#006633]/5 prose-blockquote:py-4 prose-blockquote:px-4 prose-blockquote:italic prose-blockquote:text-gray-700
                prose-a:text-[#006633] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-a:break-words
                prose-img:rounded-xl prose-img:my-8 prose-img:shadow-md prose-img:w-full prose-img:max-w-full prose-img:h-auto
                prose-ul:my-6 prose-ul:space-y-3 prose-ol:my-6 prose-ol:space-y-3
                prose-li:text-gray-700 prose-li:leading-relaxed prose-li:break-words
                prose-code:bg-gray-100 prose-code:text-[#006633] prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:break-words
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                prose-table:w-full prose-thead:bg-gray-100 prose-th:py-3 prose-th:px-4 prose-th:text-left prose-td:py-3 prose-td:px-4 prose-td:border-b prose-td:border-gray-200
                prose-hr:my-8 prose-hr:border-gray-300"
              dangerouslySetInnerHTML={{ __html: article.content || '<p>No content available.</p>' }}
            />

            {/* Author Bio Box */}
            <div className="mt-16 pt-12 border-t border-gray-200">
              {article.authors && (
                <a 
                  href={`#author/${article.author_id}`}
                  className="flex gap-6 p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-[#006633] hover:shadow-lg transition-all group"
                >
                  <img
                    src={article.authors.avatar_url}
                    alt={article.authors.name}
                    className="w-24 h-24 rounded-full border-4 border-[#006633] flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#006633] uppercase tracking-widest mb-2">About the Author</p>
                    <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3 group-hover:text-[#006633]">{article.authors.name}</h3>
                    <p className="text-gray-700 leading-relaxed">{article.authors.bio}</p>
                  </div>
                </a>
              )}
            </div>

            {/* Comments */}
            <div className="mt-16 pt-12 border-t border-gray-200">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-8">Conversation ({comments.length})</h2>

              {isSubscribed ? (
                <form onSubmit={handleComment} className="mb-10">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006633] focus:border-transparent resize-none text-base"
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
                    className="mt-4 flex items-center gap-2 px-6 py-3 bg-[#006633] text-white font-semibold rounded-xl hover:bg-[#004d24] disabled:opacity-50 transition-colors"
                  >
                    <Send size={18} />
                    Post Comment
                  </button>
                </form>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                  <p className="text-gray-700 mb-4">Subscribe to join the conversation</p>
                  <a href="#subscribe" className="inline-block px-6 py-3 bg-[#006633] text-white font-semibold rounded-xl hover:bg-[#004d24]">
                    Subscribe
                  </a>
                </div>
              )}

              <div className="space-y-4 mt-8">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-900">{comment.author_name}</p>
                    <p className="text-sm text-gray-600 mb-2">{new Date(comment.created_at).toLocaleDateString()}</p>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Right Sidebar - Table of Contents */}
          <aside className="hidden xl:block w-72 flex-shrink-0">
            {headings.length > 0 && (
              <div className="sticky top-32 bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">On This Page</h3>
                <nav className="space-y-3">
                  {headings.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(heading.id);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`block text-sm leading-relaxed transition-colors ${
                        heading.level === 1
                          ? 'font-semibold text-gray-900 hover:text-[#006633]'
                          : `pl-4 text-gray-700 hover:text-[#006633] ${activeHeading === heading.id ? 'border-l-2 border-[#006633] text-[#006633]' : 'border-l-2 border-transparent'}`
                      }`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
