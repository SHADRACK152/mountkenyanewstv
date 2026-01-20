import { useEffect, useState } from 'react';
import { getAuthors, createAuthor, updateAuthor, deleteAuthor, uploadFile } from '../../lib/api';
import { 
  LayoutDashboard, FileText, Plus, LogOut, Folder, Users, Settings,
  Trash2, Edit, X, Check, User, Mail, Camera, MessageSquare, Image
} from 'lucide-react';

interface Author {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
}

export default function AdminAuthors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', bio: '', avatar_url: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const auths = await getAuthors();
      setAuthors(auths || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.hash = 'admin-login';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('Name is required');
    
    setSaving(true);
    try {
      if (editingId) {
        await updateAuthor(editingId, formData);
      } else {
        await createAuthor(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', email: '', bio: '', avatar_url: '' });
      await load();
    } catch (e) {
      console.error(e);
      alert('Failed to save author');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (author: Author) => {
    setFormData({ 
      name: author.name, 
      email: author.email || '', 
      bio: author.bio || '', 
      avatar_url: author.avatar_url || '' 
    });
    setEditingId(author.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this author? Articles by this author may be affected.')) return;
    try {
      await deleteAuthor(id);
      await load();
    } catch (e) {
      console.error(e);
      alert('Failed to delete author');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', email: '', bio: '', avatar_url: '' });
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return alert('Only images allowed');
    if (file.size > 5 * 1024 * 1024) return alert('Max file size 5MB');
    
    setUploading(true);
    try {
      const result = await uploadFile(file);
      setFormData(prev => ({ ...prev, avatar_url: result.url }));
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to upload image. Please try a smaller image.');
    } finally {
      setUploading(false);
    }
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
          <a href="#admin" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
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
          <a href="#admin/authors" className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg">
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
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Authors</h1>
              <p className="text-gray-500">Manage article authors and contributors</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Author
            </button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {editingId ? 'Edit Author' : 'New Author'}
                </h2>
                <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                        {formData.avatar_url ? (
                          <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User size={32} className="text-gray-400" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                        <Camera size={14} className="text-white" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    {uploading && <p className="text-xs text-blue-600 mt-2 text-center">Uploading...</p>}
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Brief bio about the author..."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Check size={18} />
                    {saving ? 'Saving...' : 'Save Author'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Authors List */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : authors.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto mb-4 text-gray-300" size={48} />
                <p className="text-gray-500">No authors yet. Add your first author.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {authors.map((author) => (
                  <div key={author.id} className="p-6 hover:bg-gray-50 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {author.avatar_url ? (
                        <img src={author.avatar_url} alt={author.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{author.name}</h3>
                      {author.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail size={14} />
                          {author.email}
                        </div>
                      )}
                      {author.bio && (
                        <p className="text-sm text-gray-500 truncate mt-1">{author.bio}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(author)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(author.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
