import { Mail, Bell, Smartphone } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

export default function CTASection() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-red-900" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection animation="fade-in" className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Don't Miss Breaking News
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Get instant notifications, daily digests, and exclusive stories delivered straight to your inbox
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            {
              icon: Bell,
              title: 'Breaking Alerts',
              description: 'Instant notifications for major news stories',
            },
            {
              icon: Mail,
              title: 'Daily Digest',
              description: 'Curated news delivered every morning',
            },
            {
              icon: Smartphone,
              title: 'Mobile App',
              description: 'Read offline and get personalized recommendations',
            },
          ].map((item, index) => (
            <AnimatedSection
              key={index}
              animation="slide-up"
              delay={index * 100}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all">
                <item.icon className="w-10 h-10 text-blue-200 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-blue-100">{item.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection animation="slide-up" className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Subscribe to Our Newsletter
            </h3>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-6 py-4 rounded-lg bg-gray-100 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all focus:outline-none"
                  required
                />
                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all whitespace-nowrap">
                  Subscribe
                </button>
              </div>
              <p className="text-sm text-gray-600 text-center">
                No spam, unsubscribe anytime. We respect your privacy.
              </p>
            </form>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
