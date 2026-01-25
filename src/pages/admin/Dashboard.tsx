import { useEffect, useState } from 'react';
import { getAdminStats, getCategories, getAuthors } from '../../lib/api';
import { 
  LayoutDashboard, FileText, Eye, TrendingUp, Plus, 
  LogOut, Settings, Users, Folder, ArrowUpRight, Calendar,
  MessageSquare, Mail, Image, Vote
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await getAdminStats();
        setStats(s);
        const cats = await getCategories();
        setCategories(cats || []);
        const auths = await getAuthors();
        setAuthors(auths || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.hash = 'admin-login';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full shadow-lg border-2 border-gray-600 p-0.5 overflow-hidden flex items-center justify-center" style={{backgroundColor: '#ffffff'}}>
              <img src="/mtker.png" alt="MT Kenya News" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="font-bold">MT Kenya News</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <a href="#admin" className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg">
            <LayoutDashboard size={18} />
            Dashboard
          </a>
          <a href="#admin/articles" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <FileText size={18} />
            Articles
          </a>
          <a href="#admin/create" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <Plus size={18} />
            Create Article
          </a>
          <a href="#admin/categories" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <Folder size={18} />
            Categories
          </a>
          <a href="#admin/authors" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <Users size={18} />
            Authors
          </a>
          <a href="#admin/comments" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <MessageSquare size={18} />
            Comments
          </a>
          <a href="#admin/subscribers" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <Mail size={18} />
            Subscribers
          </a>
          <a href="#admin/gallery" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <Image size={18} />
            Gallery
          </a>
          <a href="#admin/polls" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <Vote size={18} />
            Voting Polls
          </a>
          <a href="#admin/settings" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <Settings size={18} />
            Settings
          </a>
          <a href="#admin-careers" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <FileText size={18} />
            Careers
          </a>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, Admin</p>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="#admin/create" 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={18} />
                New Article
              </a>
              <a href="#home" target="_blank" className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1">
                View Site <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText className="text-blue-600" size={24} />
                    </div>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">+12%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totals?.articles_count || 0}</p>
                  <p className="text-sm text-gray-500">Total Articles</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Eye className="text-purple-600" size={24} />
                    </div>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">+8%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{(stats?.totals?.total_views || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Total Views</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Folder className="text-green-600" size={24} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                  <p className="text-sm text-gray-500">Categories</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Users className="text-orange-600" size={24} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{authors.length}</p>
                  <p className="text-sm text-gray-500">Authors</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-4">
                    <a 
                      href="#admin/create"
                      className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                    >
                      <Plus size={32} className="text-blue-600 mb-2" />
                      <span className="font-medium text-gray-900">Create Article</span>
                    </a>
                    <a 
                      href="#admin/articles"
                      className="flex flex-col items-center justify-center p-6 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                    >
                      <FileText size={32} className="text-purple-600 mb-2" />
                      <span className="font-medium text-gray-900">Manage Articles</span>
                    </a>
                    <a 
                      href="#"
                      className="flex flex-col items-center justify-center p-6 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                    >
                      <Folder size={32} className="text-green-600 mb-2" />
                      <span className="font-medium text-gray-900">Categories</span>
                    </a>
                    <a 
                      href="#"
                      className="flex flex-col items-center justify-center p-6 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
                    >
                      <Users size={32} className="text-orange-600 mb-2" />
                      <span className="font-medium text-gray-900">Authors</span>
                    </a>
                  </div>
                </div>

                {/* Top Articles */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                      <TrendingUp size={20} />
                      Top Articles
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {stats?.top?.length > 0 ? (
                      stats.top.slice(0, 5).map((t: any, index: number) => (
                        <a 
                          key={t.id} 
                          href={`#admin/edit/${t.id}`}
                          className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-2xl font-bold text-gray-200 w-8">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{t.title}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                              <Eye size={12} />
                              {t.views.toLocaleString()} views
                            </p>
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <FileText size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No articles yet</p>
                        <a href="#admin/create" className="text-blue-600 hover:underline text-sm">Create your first article</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Articles Table */}
              <div className="mt-8 bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Recent Articles</h2>
                  <a href="#admin/articles" className="text-sm text-blue-600 hover:underline">View all</a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats?.top?.slice(0, 5).map((article: any) => (
                        <tr key={article.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{article.title}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {article.views?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {article.published_at ? new Date(article.published_at).toLocaleDateString() : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <a href={`#admin/edit/${article.id}`} className="text-blue-600 hover:underline text-sm">
                              Edit
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!stats?.top || stats.top.length === 0) && (
                    <div className="p-8 text-center text-gray-500">
                      No articles to display
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
