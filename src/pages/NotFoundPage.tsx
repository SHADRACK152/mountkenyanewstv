import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-red-900 pt-[200px] lg:pt-[220px] flex items-center justify-center">
      <div className="text-center px-4">
        {/* 404 Animation */}
        <div className="relative mb-8">
          <h1 className="text-[150px] sm:text-[200px] font-black text-white/10 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl sm:text-8xl font-black text-white mb-2">Oops!</div>
              <div className="text-xl text-blue-200">Page Not Found</div>
            </div>
          </div>
        </div>

        {/* Message */}
        <p className="text-xl text-blue-100 max-w-md mx-auto mb-10">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#home"
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-900 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            <Home size={20} />
            Go Home
          </a>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 border-2 border-white text-white rounded-lg font-bold hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>

        {/* Search */}
        <div className="mt-10">
          <p className="text-blue-200 mb-4">Or try searching for what you need:</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.querySelector('input');
              if (input?.value.trim()) {
                window.location.hash = `search/${encodeURIComponent(input.value.trim())}`;
              }
            }}
            className="max-w-md mx-auto relative"
          >
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full px-5 py-4 pl-12 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-300"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Popular Categories */}
        <div className="mt-12">
          <p className="text-blue-200 mb-4">Browse by category:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Politics', 'Business', 'Sports', 'Entertainment', 'Counties'].map((cat) => (
              <a
                key={cat}
                href={`#category/${cat.toLowerCase()}`}
                className="px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
