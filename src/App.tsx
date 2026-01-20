import { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import BreakingNewsTicker from './components/BreakingNewsTicker';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ArticlePage from './pages/ArticlePage';
import SearchPage from './pages/SearchPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/Dashboard';
import AdminArticles from './pages/admin/Articles';
import CreateArticle from './pages/admin/CreateArticle';
import EditArticle from './pages/admin/EditArticle';
import AdminCategories from './pages/admin/Categories';
import AdminAuthors from './pages/admin/Authors';
import AdminComments from './pages/admin/Comments';
import AdminSubscribers from './pages/admin/Subscribers';
import AdminSettings from './pages/admin/Settings';
import AdminGallery from './pages/admin/Gallery';
import AdminPolls from './pages/admin/Polls';
import SubscribeModal from './components/SubscribeModal';
import { updatePageTitle, resetMetaTags } from './lib/seo';

type Page = 'home' | 'category' | 'article' | 'search' | 'about' | 'contact' | 'privacy' | 'terms' | 'not-found' | 'admin' | 'admin-login' | 'admin-articles' | 'admin-create' | 'admin-edit' | 'admin-categories' | 'admin-authors' | 'admin-comments' | 'admin-subscribers' | 'admin-settings' | 'admin-gallery' | 'admin-polls' | 'subscribe';

interface RouteState {
  page: Page;
  param?: string;
}

// Check if admin is authenticated
function isAdminAuthenticated(): boolean {
  const token = localStorage.getItem('admin_token');
  if (!token) return false;
  
  try {
    // Basic JWT expiry check (decode payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// Admin route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const authenticated = isAdminAuthenticated();
    setIsAuth(authenticated);
    if (!authenticated) {
      window.location.hash = 'admin-login';
    }
  }, []);

  if (isAuth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuth) {
    return null;
  }

  return <>{children}</>;
}

function App() {
  const [route, setRoute] = useState<RouteState>({ page: 'home' });
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);

      if (!hash || hash === 'home') {
        setRoute({ page: 'home' });
        resetMetaTags();
      } else if (hash.startsWith('category/')) {
        const categorySlug = hash.split('/')[1];
        setRoute({ page: 'category', param: categorySlug });
        updatePageTitle(categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1));
      } else if (hash.startsWith('article/')) {
        const articleSlug = hash.split('/')[1];
        setRoute({ page: 'article', param: articleSlug });
      } else if (hash.startsWith('search/')) {
        const query = decodeURIComponent(hash.split('/')[1] || '');
        setRoute({ page: 'search', param: query });
        updatePageTitle(`Search: ${query}`);
      } else if (hash === 'about') {
        setRoute({ page: 'about' });
        updatePageTitle('About Us');
      } else if (hash === 'contact') {
        setRoute({ page: 'contact' });
        updatePageTitle('Contact Us');
      } else if (hash === 'privacy') {
        setRoute({ page: 'privacy' });
        updatePageTitle('Privacy Policy');
      } else if (hash === 'terms') {
        setRoute({ page: 'terms' });
        updatePageTitle('Terms of Service');
      } else if (hash === 'admin') {
        setRoute({ page: 'admin' });
      } else if (hash === 'admin/articles') {
        setRoute({ page: 'admin-articles' });
      } else if (hash === 'admin/create') {
        setRoute({ page: 'admin-create' });
      } else if (hash.startsWith('admin/edit/')) {
        const id = hash.split('/')[2];
        setRoute({ page: 'admin-edit', param: id });
      } else if (hash === 'admin/categories') {
        setRoute({ page: 'admin-categories' });
      } else if (hash === 'admin/authors') {
        setRoute({ page: 'admin-authors' });
      } else if (hash === 'admin/comments') {
        setRoute({ page: 'admin-comments' });
      } else if (hash === 'admin/subscribers') {
        setRoute({ page: 'admin-subscribers' });
      } else if (hash === 'admin/gallery') {
        setRoute({ page: 'admin-gallery' });
      } else if (hash === 'admin/polls') {
        setRoute({ page: 'admin-polls' });
      } else if (hash === 'admin/settings') {
        setRoute({ page: 'admin-settings' });
      } else if (hash === 'admin/login' || hash === 'admin-login') {
        setRoute({ page: 'admin-login' });
      } else if (hash === 'subscribe') {
        setShowSubscribeModal(true);
        // Don't change the route, just show modal
      } else {
        setRoute({ page: 'not-found' });
        updatePageTitle('Page Not Found');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  // Hide header/footer for admin pages
  const isAdminPage = route.page.startsWith('admin');

  const renderPage = () => {
    switch (route.page) {
      case 'category':
        return route.param ? <CategoryPage categorySlug={route.param} /> : <Home />;
      case 'article':
        return route.param ? <ArticlePage articleSlug={route.param} /> : <Home />;
      case 'admin-login':
        return <AdminLogin />;
      case 'admin':
        return <AdminRoute><AdminDashboard /></AdminRoute>;
      case 'admin-articles':
        return <AdminRoute><AdminArticles /></AdminRoute>;
      case 'admin-create':
        return <AdminRoute><CreateArticle /></AdminRoute>;
      case 'admin-edit':
        return <AdminRoute>{route.param ? <EditArticle articleId={route.param} /> : <AdminArticles />}</AdminRoute>;
      case 'admin-categories':
        return <AdminRoute><AdminCategories /></AdminRoute>;
      case 'admin-authors':
        return <AdminRoute><AdminAuthors /></AdminRoute>;
      case 'admin-comments':
        return <AdminRoute><AdminComments /></AdminRoute>;
      case 'admin-subscribers':
        return <AdminRoute><AdminSubscribers /></AdminRoute>;
      case 'admin-polls':
        return <AdminRoute><AdminPolls /></AdminRoute>;
      case 'admin-gallery':
        return <AdminRoute><AdminGallery /></AdminRoute>;
      case 'admin-settings':
        return <AdminRoute><AdminSettings /></AdminRoute>;
      case 'search':
        return route.param ? <SearchPage query={route.param} /> : <Home />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'privacy':
        return <PrivacyPage />;
      case 'terms':
        return <TermsPage />;
      case 'not-found':
        return <NotFoundPage />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAdminPage && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Header />
          <BreakingNewsTicker />
        </div>
      )}
      <main>
        {renderPage()}
      </main>
      {!isAdminPage && <Footer />}
      
      {/* Subscribe Modal */}
      <SubscribeModal 
        isOpen={showSubscribeModal} 
        onClose={() => {
          setShowSubscribeModal(false);
          // Remove subscribe from hash
          if (window.location.hash === '#subscribe') {
            window.history.back();
          }
        }} 
      />
    </div>
  );
}

export default App;
