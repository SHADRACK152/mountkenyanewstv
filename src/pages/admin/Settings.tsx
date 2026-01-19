import { useState } from 'react';
import { 
  LayoutDashboard, FileText, Plus, LogOut, Folder, Users, Settings,
  Globe, Bell, Shield, Palette, Database, Mail, Check, Sun, Moon, Monitor, RotateCcw, MessageSquare, Image
} from 'lucide-react';
import { useTheme, colorSchemes, ThemeColor, ThemeMode, FontSize } from '../../contexts/ThemeContext';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const { theme, setThemeMode, setThemeColor, setFontSize, setReducedMotion, setHighContrast, resetTheme } = useTheme();
  const [settings, setSettings] = useState({
    siteName: 'Mount Kenya News',
    siteTagline: 'Your trusted source for news',
    siteEmail: 'info@mtkenyanews.com',
    sitePhone: '+254 700 123 456',
    articlesPerPage: 12,
    enableComments: true,
    moderateComments: true,
    enableNewsletter: true,
    socialFacebook: '',
    socialTwitter: '',
    socialInstagram: '',
    socialYoutube: '',
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.hash = 'admin-login';
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save - in production, this would call an API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    alert('Settings saved successfully!');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
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
          <a href="#admin/settings" className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg">
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
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-500">Manage your site configuration</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Check size={20} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                        <input
                          type="text"
                          value={settings.siteName}
                          onChange={(e) => setSettings(s => ({ ...s, siteName: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                        <input
                          type="text"
                          value={settings.siteTagline}
                          onChange={(e) => setSettings(s => ({ ...s, siteTagline: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={settings.siteEmail}
                          onChange={(e) => setSettings(s => ({ ...s, siteEmail: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="text"
                          value={settings.sitePhone}
                          onChange={(e) => setSettings(s => ({ ...s, sitePhone: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                        <input
                          type="url"
                          value={settings.socialFacebook}
                          onChange={(e) => setSettings(s => ({ ...s, socialFacebook: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
                        <input
                          type="url"
                          value={settings.socialTwitter}
                          onChange={(e) => setSettings(s => ({ ...s, socialTwitter: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="https://twitter.com/yourhandle"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                        <input
                          type="url"
                          value={settings.socialInstagram}
                          onChange={(e) => setSettings(s => ({ ...s, socialInstagram: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="https://instagram.com/yourhandle"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                        <input
                          type="url"
                          value={settings.socialYoutube}
                          onChange={(e) => setSettings(s => ({ ...s, socialYoutube: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="https://youtube.com/yourchannel"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Article Settings</h3>
                    <div className="space-y-4">
                      <div className="max-w-xs">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Articles Per Page</label>
                        <input
                          type="number"
                          value={settings.articlesPerPage}
                          onChange={(e) => setSettings(s => ({ ...s, articlesPerPage: parseInt(e.target.value) }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min={1}
                          max={50}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.enableComments}
                          onChange={(e) => setSettings(s => ({ ...s, enableComments: e.target.checked }))}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Enable comments on articles</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.moderateComments}
                          onChange={(e) => setSettings(s => ({ ...s, moderateComments: e.target.checked }))}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Require comment moderation before publishing</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Newsletter</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableNewsletter}
                        onChange={(e) => setSettings(s => ({ ...s, enableNewsletter: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Enable newsletter subscription</span>
                    </label>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
                    <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
                      <Mail size={20} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-700">Email notification settings are managed through your email service provider.</p>
                        <p className="text-sm text-gray-500 mt-1">Configure SMTP settings in your server environment.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Access</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-yellow-800 font-medium">Admin credentials are managed via environment variables</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Update ADMIN_USER, ADMIN_PASS, and ADMIN_JWT_SECRET in your server's .env file.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Database</h3>
                    <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
                      <Database size={20} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-700">Database connection is configured via NEON_DATABASE_URL</p>
                        <p className="text-sm text-gray-500 mt-1">Managed in server environment variables.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-8">
                  {/* Theme Mode */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme Mode</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'light', label: 'Light', icon: Sun, desc: 'Always use light mode' },
                        { id: 'dark', label: 'Dark', icon: Moon, desc: 'Always use dark mode' },
                        { id: 'system', label: 'System', icon: Monitor, desc: 'Follow system preference' },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setThemeMode(mode.id as ThemeMode)}
                          className={`p-4 border-2 rounded-xl text-left transition-all ${
                            theme.mode === mode.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <mode.icon size={24} className={theme.mode === mode.id ? 'text-blue-600' : 'text-gray-400'} />
                          <p className="font-medium text-gray-900 mt-2">{mode.label}</p>
                          <p className="text-xs text-gray-500">{mode.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Theme */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Theme</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                      {(Object.keys(colorSchemes) as ThemeColor[]).map((color) => (
                        <button
                          key={color}
                          onClick={() => setThemeColor(color)}
                          className={`p-4 border-2 rounded-xl text-center transition-all ${
                            theme.color === color
                              ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-full mx-auto mb-2"
                            style={{ backgroundColor: colorSchemes[color].primary }}
                          />
                          <p className="text-sm font-medium text-gray-900 capitalize">{color}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Font Size</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'small', label: 'Small', sample: 'Aa', size: '14px' },
                        { id: 'medium', label: 'Medium', sample: 'Aa', size: '16px' },
                        { id: 'large', label: 'Large', sample: 'Aa', size: '18px' },
                      ].map((fs) => (
                        <button
                          key={fs.id}
                          onClick={() => setFontSize(fs.id as FontSize)}
                          className={`p-4 border-2 rounded-xl text-center transition-all ${
                            theme.fontSize === fs.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="font-serif" style={{ fontSize: fs.size }}>{fs.sample}</span>
                          <p className="font-medium text-gray-900 mt-1">{fs.label}</p>
                          <p className="text-xs text-gray-500">{fs.size}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accessibility */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Accessibility</h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">Reduced Motion</p>
                          <p className="text-sm text-gray-500">Minimize animations and transitions</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={theme.reducedMotion}
                          onChange={(e) => setReducedMotion(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">High Contrast</p>
                          <p className="text-sm text-gray-500">Increase text contrast for better readability</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={theme.highContrast}
                          onChange={(e) => setHighContrast(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Reset */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={resetTheme}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <RotateCcw size={18} />
                      Reset to Default Theme
                    </button>
                  </div>

                  {/* Preview */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                    <div className="p-6 border border-gray-200 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <h4 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Sample Article Title</h4>
                        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                          This is a preview of how your content will look with the selected theme settings.
                        </p>
                        <button 
                          className="px-4 py-2 text-white rounded-lg text-sm font-medium"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                          Read More
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
