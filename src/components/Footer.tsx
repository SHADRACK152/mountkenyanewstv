import { useState } from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone, Send, CheckCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubscribeStatus('loading');
    try {
      const res = await fetch(`${API}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setSubscribeStatus('success');
        localStorage.setItem('subscriber_email', email.trim());
        setEmail('');
        setTimeout(() => setSubscribeStatus('idle'), 3000);
      } else {
        throw new Error('Failed');
      }
    } catch {
      setSubscribeStatus('error');
      setTimeout(() => setSubscribeStatus('idle'), 3000);
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter Banner */}
      <div className="bg-theme-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold text-white mb-2">Stay Updated with the Latest News</h3>
              <p className="text-blue-200">Join 50,000+ subscribers and get breaking news delivered to your inbox</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full lg:w-auto max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-5 py-3 bg-white/10 border border-white/20 rounded-l-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                required
              />
              <button 
                type="submit"
                disabled={subscribeStatus === 'loading'}
                className="px-6 py-3 bg-theme-accent text-white font-semibold rounded-r-xl transition-colors flex items-center gap-2"
              >
                {subscribeStatus === 'loading' ? (
                  'Subscribing...'
                ) : subscribeStatus === 'success' ? (
                  <>
                    <CheckCircle size={18} />
                    Done!
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Subscribe
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#home" className="flex items-center gap-3 mb-5 group">
              <div className="w-14 h-14 rounded-full shadow-lg border-2 border-gray-400 p-1 group-hover:scale-105 transition-transform duration-300 overflow-hidden flex items-center justify-center" style={{backgroundColor: '#ffffff'}}>
                <img 
                  src="/mtker.png" 
                  alt="Mount Kenya News" 
                  className="w-11 h-11 object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-black text-white block leading-none">Mount Kenya</span>
                <span className="text-xl font-black text-theme-accent block leading-none">News</span>
              </div>
            </a>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Your trusted source for accurate, timely, and comprehensive news coverage across Kenya and beyond. 
              We are committed to truth, integrity, and excellence in journalism.
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                <Facebook size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                <Twitter size={18} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-500 rounded-lg flex items-center justify-center transition-colors">
                <Instagram size={18} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-bold mb-5 text-lg">Categories</h4>
            <ul className="space-y-3">
              <li><a href="#category/politics" className="text-gray-400 hover:text-white transition-colors">Politics</a></li>
              <li><a href="#category/business" className="text-gray-400 hover:text-white transition-colors">Business</a></li>
              <li><a href="#category/sports" className="text-gray-400 hover:text-white transition-colors">Sports</a></li>
              <li><a href="#category/entertainment" className="text-gray-400 hover:text-white transition-colors">Entertainment</a></li>
              <li><a href="#category/lifestyle" className="text-gray-400 hover:text-white transition-colors">Lifestyle</a></li>
              <li><a href="#category/counties" className="text-gray-400 hover:text-white transition-colors">Counties</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-bold mb-5 text-lg">Company</h4>
            <ul className="space-y-3">
              <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              <li><a href="#careers" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#advertise" className="text-gray-400 hover:text-white transition-colors">Advertise</a></li>
              <li><a href="#privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-5 text-lg">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-theme-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">
                  Kimathi Street, Nairobi<br />
                  Kenya
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-theme-primary flex-shrink-0" />
                <span className="text-gray-400 text-sm">+254 700 123 456</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-theme-primary flex-shrink-0" />
                <span className="text-gray-400 text-sm">info@mtkenyanews.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Mount Kenya News. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="#terms" className="hover:text-white transition-colors">Terms</a>
              <a href="#cookies" className="hover:text-white transition-colors">Cookies</a>
              <a href="#admin-login" className="hover:text-white transition-colors">Admin</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
