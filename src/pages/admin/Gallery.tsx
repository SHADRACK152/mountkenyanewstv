import { useEffect, useState } from 'react';
import { adminGetArticles } from '../../lib/api';
import { 
  LayoutDashboard, FileText, Plus, LogOut, Settings, Users, Folder, 
  MessageSquare, Mail, Image, Download, Trash2, ExternalLink, Search, Grid, List
} from 'lucide-react';

interface GalleryImage {
  url: string;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  uploadedAt: string;
}

export default function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const articles = await adminGetArticles();
      const imageList: GalleryImage[] = [];
      
      articles?.forEach((article: any) => {
        if (article.featured_image) {
          imageList.push({
            url: article.featured_image,
            articleId: article.id,
            articleTitle: article.title,
            articleSlug: article.slug,
            uploadedAt: article.created_at
          });
        }
        
        // Extract images from content (if any embedded images)
        if (article.content) {
          const imgMatches = article.content.match(/<img[^>]+src="([^"]+)"[^>]*>/g);
          imgMatches?.forEach((match: string) => {
            const srcMatch = match.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1] && !imageList.find(img => img.url === srcMatch[1])) {
              imageList.push({
                url: srcMatch[1],
                articleId: article.id,
                articleTitle: article.title,
                articleSlug: article.slug,
                uploadedAt: article.created_at
              });
            }
          });
        }
      });
      
      // Sort by upload date (newest first)
      imageList.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setImages(imageList);
    } catch (e) {
      console.error('Failed to load images:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.hash = 'admin-login';
  };

  const filteredImages = images.filter(img => 
    img.articleTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Image URL copied to clipboard!');
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
          <a href="#admin/gallery" className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg">
            <Image size={18} />
            Gallery
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
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Media Gallery</h1>
              <p className="text-gray-600 mt-1">All images uploaded across articles ({images.length} total)</p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center bg-white rounded-lg border shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-l-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-r-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by article title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Image className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Images Found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'No images match your search.' : 'Upload images when creating articles.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredImages.map((image, index) => (
                <div 
                  key={`${image.articleId}-${index}`}
                  className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src={image.url} 
                      alt={image.articleTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Image+Not+Found';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.open(image.url, '_blank'); }}
                        className="p-2 bg-white rounded-lg hover:bg-gray-100"
                        title="Open in new tab"
                      >
                        <ExternalLink size={18} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(image.url); }}
                        className="p-2 bg-white rounded-lg hover:bg-gray-100"
                        title="Copy URL"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{image.articleTitle}</p>
                    <p className="text-xs text-gray-500">{new Date(image.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Image</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Article</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredImages.map((image, index) => (
                    <tr key={`${image.articleId}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <img 
                          src={image.url} 
                          alt={image.articleTitle}
                          className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => setSelectedImage(image)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Error';
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <a 
                          href={`#admin/edit/${image.articleId}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {image.articleTitle}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(image.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => window.open(image.url, '_blank')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Open in new tab"
                          >
                            <ExternalLink size={18} />
                          </button>
                          <button 
                            onClick={() => copyToClipboard(image.url)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Copy URL"
                          >
                            <Download size={18} />
                          </button>
                          <a 
                            href={`#article/${image.articleSlug}`}
                            target="_blank"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Article"
                          >
                            <FileText size={18} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.articleTitle}
                className="w-full max-h-[60vh] object-contain bg-gray-100"
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
              >
                <Trash2 size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedImage.articleTitle}</h3>
              <p className="text-gray-500 text-sm mb-4">Uploaded: {new Date(selectedImage.uploadedAt).toLocaleString()}</p>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => window.open(selectedImage.url, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <ExternalLink size={18} />
                  Open Full Size
                </button>
                <button 
                  onClick={() => copyToClipboard(selectedImage.url)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Download size={18} />
                  Copy URL
                </button>
                <a 
                  href={`#admin/edit/${selectedImage.articleId}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <FileText size={18} />
                  Edit Article
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
