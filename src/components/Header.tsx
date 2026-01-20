import { useState, useEffect } from 'react';
import { Menu, X, Search, Facebook, Twitter, Instagram, Youtube, ChevronDown, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const navigation = [
  { name: 'Home', href: '#home' },
  { name: 'Politics', href: '#category/politics' },
  { name: 'Business', href: '#category/business' },
  { name: 'Counties', href: '#category/counties' },
  { name: 'Sports', href: '#category/sports' },
  { name: 'Entertainment', href: '#category/entertainment' },
  { name: 'Opinion', href: '#category/opinion' },
  { name: 'Investigations', href: '#category/investigations' },
  { name: 'Lifestyle', href: '#category/lifestyle' },
  { name: 'Polls', href: '#polls' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDark, setThemeMode } = useTheme();

  const toggleDarkMode = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.hash = `search/${encodeURIComponent(searchQuery.trim())}`;
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className={`transition-all duration-300 ${
      isScrolled ? 'shadow-xl' : ''
    }`}>
      {/* Top Bar */}
      <div className="bg-theme-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10 text-sm">
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center space-x-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
                  <Facebook size={16} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
                  <Twitter size={16} />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
                  <Instagram size={16} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
                  <Youtube size={16} />
                </a>
              </div>
              <span className="text-white/60 hidden md:block">|</span>
              <span className="text-white/80 hidden md:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="text-white/80 hover:text-white transition-colors p-1"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <a href="#admin-login" className="text-white/80 hover:text-white text-xs sm:text-sm flex items-center gap-1 transition-colors">
                <User size={14} />
                <span className="hidden sm:inline">Admin</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="#home" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-14 h-14 rounded-full shadow-lg border-2 border-gray-300 p-1 group-hover:scale-105 transition-transform duration-300 overflow-hidden flex items-center justify-center" style={{backgroundColor: '#ffffff'}}>
                  <img 
                    src="/mtker.png" 
                    alt="Mount Kenya News" 
                    className="w-11 h-11 object-contain"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                  Mount Kenya
                </span>
                <span className="text-xl sm:text-2xl font-black text-theme-accent tracking-tight leading-none">
                  News
                </span>
              </div>
            </a>

            {/* Desktop Search */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search news..."
                  className="w-full px-4 py-2.5 pl-11 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary focus:bg-white transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-theme-primary hover:bg-gray-100 rounded-full transition-colors"
              >
                <Search size={22} />
              </button>
              <a
                href="#subscribe"
                className="hidden sm:flex items-center px-5 py-2.5 bg-theme-accent text-white text-sm font-semibold rounded-full transition-colors shadow-md hover:shadow-lg"
              >
                Subscribe
              </a>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-theme-primary hover:bg-gray-100 rounded-full transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="hidden lg:block bg-theme-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12">
            <div className="flex items-center space-x-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
                >
                  {item.name}
                </a>
              ))}
              <div className="relative group">
                <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors">
                  More <ChevronDown size={16} className="ml-1" />
                </button>
                <div className="absolute top-full left-0 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <a href="#category/technology" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-900 first:rounded-t-lg">
                    Technology
                  </a>
                  <a href="#category/world" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-900 last:rounded-b-lg">
                    World News
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-theme-primary hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <a
                href="#category/technology"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-900 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Technology
              </a>
              <a
                href="#category/world"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-900 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                World News
              </a>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a
                href="#subscribe"
                className="block w-full text-center px-4 py-3 bg-theme-accent text-white font-semibold rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Subscribe Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search */}
      {isSearchOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full px-4 py-3 pl-12 bg-gray-100 border-0 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-theme-primary focus:bg-white transition-all"
                autoFocus
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
