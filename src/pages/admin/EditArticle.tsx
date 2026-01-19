import { useEffect, useState, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-react';

// Register the image resize module
Quill.register('modules/imageResize', ImageResize);
import { adminGetArticle, updateArticle, getCategories, getAuthors, getPresign, uploadFile } from '../../lib/api';
import { 
  ArrowLeft, Save, Clock, Image, X,
  LayoutDashboard, FileText, Plus, LogOut, Folder, Users, Settings
} from 'lucide-react';

interface Props { articleId: string }

export default function EditArticle({ articleId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'server' | 's3' | 'url'>('server');
  const [readingTime, setReadingTime] = useState(5);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const cats = await getCategories();
        setCategories(cats || []);
        const auths = await getAuthors();
        setAuthors(auths || []);
        const a = await adminGetArticle(articleId);
        if (a) {
          setTitle(a.title || '');
          setSlug(a.slug || '');
          setExcerpt(a.excerpt || '');
          setContent(a.content || '');
          setFeaturedImage(a.featured_image || '');
          setCategoryId(a.category_id || (cats && cats[0] && cats[0].id));
          setAuthorId(a.author_id || (auths && auths[0] && auths[0].id));
          setIsFeatured(a.is_featured || false);
          setIsBreaking(a.is_breaking || false);
          setReadingTime(a.reading_time || 5);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [articleId]);

  // Auto-calculate reading time from content
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, '');
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const time = Math.max(1, Math.ceil(wordCount / 200));
    setReadingTime(time);
  }, [content]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.hash = 'admin-login';
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Only images allowed');
    if (file.size > 5 * 1024 * 1024) return alert('Max file size 5MB');
    try {
      setUploading(true);
      if (uploadMode === 'server') {
        const r = await uploadFile(file);
        setFeaturedImage(r.url);
      } else if (uploadMode === 's3') {
        const { url, publicUrl } = await getPresign(file.name, file.type);
        await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        setFeaturedImage(publicUrl);
      }
    } catch (e) {
      console.error(e);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) return alert('Title and slug required');
    if (!authorId) return alert('Select an author');
    if (!categoryId) return alert('Select a category');
    
    setSaving(true);
    try {
      await updateArticle(articleId, {
        title,
        slug,
        excerpt,
        content,
        featured_image: featuredImage,
        category_id: categoryId,
        author_id: authorId,
        reading_time: readingTime,
        is_featured: isFeatured,
        is_breaking: isBreaking,
      });
      alert('Article updated successfully!');
      window.location.hash = 'admin/articles';
    } catch (err) {
      console.error(err);
      alert('Update failed');
    } finally {
      setSaving(false);
    }
  };

  // Quill modules configuration
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize', 'Toolbar']
    }
  }), []);

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'indent', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video',
    'color', 'background',
    'width', 'height', 'style'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
            <div className="flex items-center gap-4">
              <a href="#admin/articles" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={20} className="text-gray-600" />
              </a>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Edit Article</h1>
                <p className="text-sm text-gray-500">Update article details</p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
            {/* Title & Slug */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Article title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="article-slug"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reading Time</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={readingTime}
                      onChange={(e) => setReadingTime(parseInt(e.target.value) || 1)}
                      min={1}
                      className="w-24 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500">minutes</span>
                    <Clock size={16} className="text-gray-400" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Brief summary of the article..."
                  />
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                formats={quillFormats}
                className="bg-white rounded-xl"
                style={{ minHeight: '400px' }}
              />
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <span>{content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured Image</h2>
              
              <div className="flex gap-3 mb-4">
                {['server', 's3', 'url'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setUploadMode(mode as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      uploadMode === mode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mode === 'server' ? 'Server' : mode === 's3' ? 'S3' : 'URL'}
                  </button>
                ))}
              </div>

              {uploadMode === 'url' ? (
                <input
                  type="url"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              ) : (
                <div className="flex items-start gap-4">
                  <div 
                    className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Image size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 text-sm">
                        {uploading ? 'Uploading...' : 'Click or drop image here'}
                      </p>
                    </label>
                  </div>
                  {featuredImage && (
                    <div className="relative">
                      <img src={featuredImage} alt="Preview" className="h-32 rounded-xl" />
                      <button
                        type="button"
                        onClick={() => setFeaturedImage('')}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Category & Author */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Publishing Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={categoryId || ''}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                  <select
                    value={authorId || ''}
                    onChange={(e) => setAuthorId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select author</option>
                    {authors.map((auth) => (
                      <option key={auth.id} value={auth.id}>{auth.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-6 mt-4 pt-4 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Featured Article</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBreaking}
                    onChange={(e) => setIsBreaking(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-gray-700">Breaking News</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Quill Editor Styles */}
      <style>{`
        .ql-container {
          font-size: 16px;
          min-height: 350px;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }
        .ql-toolbar {
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          background: #f9fafb;
        }
        .ql-editor {
          min-height: 350px;
        }
        .ql-editor p {
          margin-bottom: 1em;
        }
      `}</style>
    </div>
  );
}
