import { useEffect, useState } from 'react';
import { Mail, MapPin, Briefcase, Award, ArrowLeft, Clock, FileText } from 'lucide-react';
import * as api from '../lib/api';
import type { ArticleWithRelations } from '../lib/database.types';

interface Author {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
  education?: string;
  experience?: string;
  specialization?: string;
  location?: string;
}

interface AuthorPageProps {
  authorId: string;
}

export default function AuthorPage({ authorId }: AuthorPageProps) {
  const [author, setAuthor] = useState<Author | null>(null);
  const [authorArticles, setAuthorArticles] = useState<ArticleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch author details
        const authorsRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/authors/${authorId}`);
        if (authorsRes.ok) {
          const authorData = await authorsRes.json();
          setAuthor(authorData);
        }

        // Fetch author's articles
        const articlesRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/articles/author/${authorId}`);
        if (articlesRes.ok) {
          const articles = await articlesRes.json();
          setAuthorArticles(articles || []);
        }
      } catch (err) {
        console.error('Failed to load author:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-[200px] lg:pt-[220px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006633] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading author profile...</p>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-white pt-[200px] lg:pt-[220px]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-20 text-center">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">Author Not Found</h1>
          <p className="text-gray-600 mb-8">We couldn't find the author you're looking for.</p>
          <a href="#" className="inline-flex items-center gap-2 px-6 py-3 bg-[#006633] text-white font-semibold rounded-full hover:bg-[#004d24] transition-colors">
            <ArrowLeft size={18} />
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 sticky top-0 z-40 pt-[200px] lg:pt-[220px]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-4">
          <a href="#" className="inline-flex items-center gap-2 text-[#006633] font-semibold hover:text-[#004d24] transition-colors">
            <ArrowLeft size={18} />
            Back
          </a>
        </div>
      </div>

      {/* Author Hero Section */}
      <div className="bg-gradient-to-br from-gray-50 to-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Author Avatar */}
            <div className="md:col-span-1">
              {author.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt={author.name}
                  className="w-48 h-48 rounded-2xl object-cover border-4 border-[#006633] shadow-lg"
                />
              ) : (
                <div className="w-48 h-48 rounded-2xl bg-gray-300 flex items-center justify-center border-4 border-[#006633]">
                  <span className="text-5xl text-gray-400">{author.name[0]}</span>
                </div>
              )}
            </div>

            {/* Author Info */}
            <div className="md:col-span-3">
              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 mb-2">{author.name}</h1>
              
              {author.specialization && (
                <p className="text-sm font-bold text-[#006633] uppercase tracking-widest mb-4">{author.specialization}</p>
              )}

              {author.bio && (
                <p className="text-lg text-gray-700 leading-relaxed mb-8">{author.bio}</p>
              )}

              {/* Author Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {author.email && (
                  <div className="flex items-start gap-3">
                    <Mail size={20} className="text-[#006633] flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Contact</p>
                      <p className="text-gray-900 font-medium break-all">{author.email}</p>
                    </div>
                  </div>
                )}

                {author.location && (
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-[#006633] flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Location</p>
                      <p className="text-gray-900 font-medium">{author.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Experience & Education Section */}
              <div className="space-y-6">
                {author.experience && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase size={18} className="text-[#006633]" />
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Experience</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{author.experience}</p>
                  </div>
                )}

                {author.education && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Award size={18} className="text-[#006633]" />
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Education</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{author.education}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Articles by Author */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16">
        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-12">
          Articles by {author.name.split(' ')[0]}
        </h2>

        {authorArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {authorArticles.map((article) => (
              <a
                key={article.id}
                href={`#article/${article.slug}`}
                className="group rounded-2xl overflow-hidden border border-gray-200 hover:border-[#006633] hover:shadow-lg transition-all"
              >
                {/* Article Image */}
                <div className="relative h-48 overflow-hidden bg-gray-300">
                  {article.featured_image && (
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>

                {/* Article Content */}
                <div className="p-6">
                  {article.categories && (
                    <span className="text-xs font-bold text-[#006633] uppercase tracking-widest">
                      {article.categories.name}
                    </span>
                  )}
                  <h3 className="font-serif text-xl font-bold text-gray-900 mt-3 mb-2 group-hover:text-[#006633] transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">{article.excerpt}</p>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {article.reading_time} min
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {new Date(article.published_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">{author.name} hasn't published any articles yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
