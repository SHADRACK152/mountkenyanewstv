import { useEffect, useState } from 'react';
import { adminGetArticles, deleteArticle } from '../../lib/api';
import { 
  LayoutDashboard, FileText, Plus, LogOut, Folder, Users, Settings,
  Trash2, Edit, Eye, Calendar, Search
} from 'lucide-react';

export default function AdminArticles() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const a = await adminGetArticles();
      setItems(a || []);
    } catch (e) {
      console.error(e);
      alert('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    try {
      await deleteArticle(id);
      setItems((s) => s.filter((i) => i.id !== id));
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.hash = 'admin-login';
  };

  const filteredItems = items.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <p className="text-xs text-gray-400">Admin Panel</p></p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <a href="#admin" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <LayoutDashboard size={18} />
            Dashboard
          </a>
          <a href="#admin/articles" className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg">
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
          <a href="#admin/settings" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <Settings size={18} />
            Settings
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
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
              <p className="text-sm text-gray-500">{items.length} total articles</p>
            </div>
            <a 
              href="#admin/create" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              New Article
            </a>
          </div>
        </header>

        <div className="p-8">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Articles Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Article</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Views</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Published</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.length > 0 ? filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {item.featured_image ? (
                              <img 
                                src={item.featured_image} 
                                alt="" 
                                className="w-16 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <FileText size={20} className="text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 line-clamp-1">{item.title}</p>
                              <p className="text-sm text-gray-500">/{item.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Eye size={14} />
                            {(item.views || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1 text-gray-600 text-sm">
                            <Calendar size={14} />
                            {item.published_at ? new Date(item.published_at).toLocaleDateString() : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {item.is_featured && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Featured</span>
                            )}
                            {item.is_breaking && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Breaking</span>
                            )}
                            {!item.is_featured && !item.is_breaking && (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Published</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <a 
                              href={`#article/${item.slug}`}
                              target="_blank"
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye size={18} />
                            </a>
                            <a 
                              href={`#admin/edit/${item.id}`}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </a>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-500 mb-2">
                            {searchTerm ? 'No articles match your search' : 'No articles yet'}
                          </p>
                          <a 
                            href="#admin/create" 
                            className="text-blue-600 hover:underline"
                          >
                            Create your first article
                          </a>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
