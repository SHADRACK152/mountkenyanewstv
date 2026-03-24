import { useState, useEffect } from 'react';
import { Menu, X, Search, User, Sun, Moon } from 'lucide-react';
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDark, setThemeMode } = useTheme();

  const toggleDarkMode = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.hash = `search/${encodeURIComponent(searchQuery.trim())}`;
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2 flex-shrink-0 group min-w-fit">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-1 group-hover:scale-105 transition-transform overflow-hidden flex items-center justify-center shadow-sm">
              <img 
                src="/mtker.png" 
                alt="Mount Kenya News" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                Mount Kenya
              </span>
              <span className="text-xs font-bold text-[#006633] uppercase tracking-tight">
                News
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#006633] dark:hover:text-[#00cc66] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {/* Search Bar - Desktop */}
            <div className="hidden md:flex items-center">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-32 lg:w-48 px-3 py-2 pl-9 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#006633] transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              </form>
            </div>

            {/* Subscribe Button */}
            <a
              href="#subscribe"
              className="hidden sm:inline-flex items-center px-3 py-2 bg-[#006633] hover:bg-[#004d24] text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
            >
              Subscribe
            </a>

            {/* Toggle Dark Mode */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#006633] dark:hover:text-[#00cc66] rounded-full transition-colors"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Admin Link */}
            <a 
              href="#admin-login" 
              className="hidden sm:flex items-center gap-1 p-2 text-gray-600 dark:text-gray-400 hover:text-[#006633] dark:hover:text-[#00cc66] rounded-full transition-colors text-xs"
              title="Admin"
            >
              <User size={16} />
            </a>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-[#006633] dark:hover:text-[#00cc66] rounded-full transition-colors"
            >
              <Search size={16} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-[#006633] dark:hover:text-[#00cc66] rounded-full transition-colors"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden pb-3 border-t border-gray-200 dark:border-gray-800 pt-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search news..."
                className="w-full px-3 py-2 pl-9 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#006633] transition-all"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </form>
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 py-3 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#006633] dark:hover:text-[#00cc66] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
              <a
                href="#subscribe"
                className="block px-4 py-2 text-sm font-medium text-[#006633] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Subscribe
              </a>
              <a
                href="#admin-login"
                className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#006633] dark:hover:text-[#00cc66] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
