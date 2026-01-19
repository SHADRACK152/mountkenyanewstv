import { useState, useEffect } from 'react';
import { Users, Mail, Calendar, Trash2, Search, Download, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface Subscriber {
  id: string;
  email: string;
  name: string;
  is_verified: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
  comment_count: number;
  like_count: number;
}

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const subscribersPerPage = 15;

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API}/api/admin/subscribers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscribers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscriber? This will also delete their comments and likes.')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API}/api/admin/subscribers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSubscribers(subscribers.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete subscriber:', err);
    }
  };

  const exportSubscribers = () => {
    const activeSubscribers = subscribers.filter(s => !s.unsubscribed_at);
    const csv = [
      'Email,Name,Subscribed Date',
      ...activeSubscribers.map(s => `${s.email},${s.name || ''},${new Date(s.subscribed_at).toLocaleDateString()}`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Filter and search
  let filteredSubscribers = subscribers;
  
  if (filter === 'active') {
    filteredSubscribers = filteredSubscribers.filter(s => !s.unsubscribed_at);
  } else if (filter === 'unsubscribed') {
    filteredSubscribers = filteredSubscribers.filter(s => s.unsubscribed_at);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredSubscribers = filteredSubscribers.filter(s => 
      s.email.toLowerCase().includes(query) ||
      (s.name && s.name.toLowerCase().includes(query))
    );
  }

  // Pagination
  const totalPages = Math.ceil(filteredSubscribers.length / subscribersPerPage);
  const startIndex = (currentPage - 1) * subscribersPerPage;
  const paginatedSubscribers = filteredSubscribers.slice(startIndex, startIndex + subscribersPerPage);

  const activeCount = subscribers.filter(s => !s.unsubscribed_at).length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white p-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full shadow-lg border-2 border-gray-600 p-0.5 overflow-hidden flex items-center justify-center" style={{backgroundColor: '#ffffff'}}>
            <img src="/mtker.png" alt="MT Kenya News" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="font-bold">MT Kenya News</h1>
            <p className="text-gray-400 text-sm">Admin Dashboard</p>
          </div>
        </div>
        <nav className="space-y-2">
          <a href="#admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span>📊</span> Dashboard
          </a>
          <a href="#admin/articles" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span>📰</span> Articles
          </a>
          <a href="#admin/categories" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span>📁</span> Categories
          </a>
          <a href="#admin/authors" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span>👤</span> Authors
          </a>
          <a href="#admin/comments" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span>💬</span> Comments
          </a>
          <a href="#admin/subscribers" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white">
            <span>📧</span> Subscribers
          </a>
          <a href="#admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span>⚙️</span> Settings
          </a>
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <a href="#home" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <span>🌐</span> View Site
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscribers</h1>
            <p className="text-gray-600">Manage newsletter subscribers</p>
          </div>
          <button
            onClick={exportSubscribers}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{subscribers.length}</p>
                <p className="text-gray-500">Total Subscribers</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <UserCheck size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                <p className="text-gray-500">Active Subscribers</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <UserX size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{subscribers.length - activeCount}</p>
                <p className="text-gray-500">Unsubscribed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('unsubscribed')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'unsubscribed' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unsubscribed
              </button>
            </div>
          </div>
        </div>

        {/* Subscribers Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading subscribers...</p>
            </div>
          ) : paginatedSubscribers.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No subscribers found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Subscribed</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Activity</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Mail size={14} className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{subscriber.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {subscriber.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {subscriber.unsubscribed_at ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          Unsubscribed
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(subscriber.subscribed_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <span>{subscriber.comment_count || 0} comments</span>
                        <span>•</span>
                        <span>{subscriber.like_count || 0} likes</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(subscriber.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + subscribersPerPage, filteredSubscribers.length)} of {filteredSubscribers.length} subscribers
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="px-3 py-1 text-sm font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
