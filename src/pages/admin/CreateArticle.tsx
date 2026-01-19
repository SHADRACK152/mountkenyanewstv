import { useEffect, useState, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { createArticle, getCategories, getAuthors, uploadFile, getPresign } from '../../lib/api';
import { 
  ArrowLeft, ArrowRight, Save, Clock, Image, X, Check,
  LayoutDashboard, FileText, Plus, LogOut, Folder, Users, Settings,
  Type, AlignLeft, ImageIcon, Tag, MessageSquare, Mail
} from 'lucide-react';

interface StepProps {
  isActive: boolean;
  isCompleted: boolean;
  number: number;
  title: string;
}

function StepIndicator({ isActive, isCompleted, number, title }: StepProps) {
  return (
    <div className={`flex items-center gap-3 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
        isActive ? 'bg-blue-600 text-white' : 
        isCompleted ? 'bg-green-600 text-white' : 
        'bg-gray-200 text-gray-500'
      }`}>
        {isCompleted ? <Check size={18} /> : number}
      </div>
      <span className={`hidden sm:block font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
        {title}
      </span>
    </div>
  );
}

export default function CreateArticle() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  // Form data
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [readingTime, setReadingTime] = useState(5);
  
  // Data
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  // UI State
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'server' | 's3' | 'url'>('server');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      setDataLoading(true);
      try {
        const cats = await getCategories();
        console.log('Categories loaded:', cats);
        setCategories(cats || []);
        const auths = await getAuthors();
        console.log('Authors loaded:', auths);
        setAuthors(auths || []);
        setAuthorId((auths && auths[0] && auths[0].id) || null);
        setCategoryId((cats && cats[0] && cats[0].id) || null);
      } catch (e) {
        console.error('Failed to load categories/authors:', e);
      }
    })();
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setSlug(generatedSlug);
  };

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

  const submit = async () => {
    if (!title || !slug) return alert('Title and slug required');
    if (!authorId) return alert('Select an author');
    if (!categoryId) return alert('Select a category');
    setCreating(true);
    try {
      const created = await createArticle({
        title,
        slug,
        excerpt,
        content,
        featured_image: featuredImage,
        category_id: categoryId,
        author_id: authorId,
        published_at: new Date().toISOString(),
        reading_time: readingTime,
        is_featured: isFeatured,
        is_breaking: isBreaking,
      });
      if (created && created.slug) {
        alert('Article created successfully!');
        window.location.hash = 'admin/articles';
      } else {
        alert('Created, but missing slug');
      }
    } catch (err) {
      console.error(err);
      alert('Create failed');
    } finally {
      setCreating(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return title.trim().length > 0 && slug.trim().length > 0;
      case 2: return content.replace(/<[^>]*>/g, '').trim().length > 0;
      case 3: return true; // Image is optional
      case 4: return categoryId && authorId;
      default: return false;
    }
  };

  const nextStep = () => {
    if (step < totalSteps && canProceed()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
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
    ]
  }), []);

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'indent', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video',
    'color', 'background'
  ];

  const steps = [
    { number: 1, title: 'Basic Info', icon: Type },
    { number: 2, title: 'Content', icon: AlignLeft },
    { number: 3, title: 'Media', icon: ImageIcon },
    { number: 4, title: 'Publish', icon: Tag },
  ];

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
          <a href="#admin/create" className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg">
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
                <h1 className="text-xl font-bold text-gray-900">Create New Article</h1>
                <p className="text-sm text-gray-500">Step {step} of {totalSteps}</p>
              </div>
            </div>
            {step === totalSteps && (
              <button
                onClick={submit}
                disabled={creating || !canProceed()}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={18} />
                {creating ? 'Publishing...' : 'Publish Article'}
              </button>
            )}
          </div>
        </header>

        {/* Progress Steps */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((s, idx) => (
              <div key={s.number} className="flex items-center">
                <button
                  onClick={() => s.number <= step && setStep(s.number)}
                  disabled={s.number > step}
                  className="focus:outline-none"
                >
                  <StepIndicator
                    number={s.number}
                    title={s.title}
                    isActive={step === s.number}
                    isCompleted={step > s.number}
                  />
                </button>
                {idx < steps.length - 1 && (
                  <div className={`w-12 sm:w-24 h-0.5 mx-2 ${step > s.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Type size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
                    <p className="text-gray-500">Enter the article title and excerpt</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Article Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter a compelling headline..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      URL Slug *
                    </label>
                    <div className="flex items-center">
                      <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-500 text-sm">
                        /article/
                      </span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="article-slug"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-generated from title. Edit if needed.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Excerpt / Summary
                    </label>
                    <textarea
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="A brief summary that appears in article previews..."
                    />
                    <p className="text-xs text-gray-500 mt-1">{excerpt.length}/300 characters recommended</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Content */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <AlignLeft size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Article Content</h2>
                    <p className="text-gray-500">Write your article using the rich text editor</p>
                  </div>
                </div>

                <div className="prose-editor">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={quillModules}
                    formats={quillFormats}
                    className="bg-white rounded-xl"
                    style={{ minHeight: '400px' }}
                  />
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{readingTime} min read</span>
                  </div>
                  <div>
                    {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Media */}
            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <ImageIcon size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Featured Image</h2>
                    <p className="text-gray-500">Upload a cover image for your article</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Upload Mode Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Method</label>
                    <div className="flex gap-3">
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
                          {mode === 'server' ? 'Server Upload' : mode === 's3' ? 'S3 Upload' : 'URL'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {uploadMode === 'url' ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                      <input
                        type="url"
                        value={featuredImage}
                        onChange={(e) => setFeaturedImage(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Image</label>
                      <div 
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                          uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          handleFile(e.dataTransfer.files[0]); 
                        }}
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
                          <Image size={48} className="mx-auto text-gray-400 mb-4" />
                          {uploading ? (
                            <p className="text-blue-600 font-medium">Uploading...</p>
                          ) : (
                            <>
                              <p className="text-gray-700 font-medium">Drop an image here or click to upload</p>
                              <p className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {featuredImage && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Preview</label>
                      <div className="relative inline-block">
                        <img 
                          src={featuredImage} 
                          alt="Preview" 
                          className="max-h-64 rounded-xl shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setFeaturedImage('')}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Publish Settings */}
            {step === 4 && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Tag size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Publish Settings</h2>
                    <p className="text-gray-500">Set category, author, and article options</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                    <select
                      value={categoryId || ''}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Author *</label>
                    <select
                      value={authorId || ''}
                      onChange={(e) => setAuthorId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select author</option>
                      {authors.map((auth) => (
                        <option key={auth.id} value={auth.id}>{auth.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Reading Time</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={readingTime}
                        onChange={(e) => setReadingTime(parseInt(e.target.value) || 1)}
                        min={1}
                        className="w-24 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-500">minutes</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Article Flags</h3>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Featured Article</span>
                        <p className="text-xs text-gray-500">Show in featured section</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:border-red-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={isBreaking}
                        onChange={(e) => setIsBreaking(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Breaking News</span>
                        <p className="text-xs text-gray-500">Show in breaking ticker</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Preview Summary */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Article Preview</h3>
                  <div className="bg-gray-50 rounded-xl p-4 flex gap-4">
                    {featuredImage ? (
                      <img src={featuredImage} alt="" className="w-32 h-24 object-cover rounded-lg" />
                    ) : (
                      <div className="w-32 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ImageIcon size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{title || 'Article Title'}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {excerpt || 'Article excerpt will appear here...'}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{categories.find(c => c.id === categoryId)?.name || 'Category'}</span>
                        <span>•</span>
                        <span>{authors.find(a => a.id === authorId)?.name || 'Author'}</span>
                        <span>•</span>
                        <span>{readingTime} min read</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={prevStep}
                disabled={step === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                  step === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ArrowLeft size={18} />
                Previous
              </button>

              {step < totalSteps ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                    canProceed() 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next Step
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={creating || !canProceed()}
                  className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={18} />
                  {creating ? 'Publishing...' : 'Publish Article'}
                </button>
              )}
            </div>
          </div>
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
