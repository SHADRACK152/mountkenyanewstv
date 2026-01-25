import { Mail, Phone, MapPin, Send } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

export default function ContactSection() {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-in" className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">
            Get in Touch
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Contact Us
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have a story tip, feedback, or partnership inquiry? We'd love to hear from you.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: Mail,
              title: 'Email',
              content: 'info@mtkenyanews.com',
              subtext: 'Newsroom & General Inquiries',
            },
            {
              icon: Phone,
              title: 'Phone',
              content: '0722 686 392',
              subtext: 'Available 24/7',
            },
            {
              icon: MapPin,
              title: 'Address',
              content: 'Witeithie, Thika, Kenya',
              subtext: 'Mt. Kenya Region',
            },
          ].map((item, index) => (
            <AnimatedSection
              key={index}
              animation="slide-up"
              delay={index * 100}
            >
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-100 p-8 hover:shadow-lg transition-all text-center">
                <item.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-900 font-semibold mb-2">{item.content}</p>
                <p className="text-sm text-gray-600">{item.subtext}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <AnimatedSection animation="slide-left">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h3>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all focus:outline-none"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-lg bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all focus:outline-none"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all focus:outline-none"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all focus:outline-none resize-none"
                    placeholder="Your message here..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Send Message</span>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slide-right">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Story Tips</h3>
                <p className="text-gray-600 mb-4">
                  Have an important story we should cover? Send us your tip with details and we'll investigate.
                </p>
                <a href="mailto:tips@mtkenyanews.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                  tips@mtkenyanews.com
                </a>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Press & Media</h3>
                <p className="text-gray-600 mb-4">
                  For interview requests, press releases, or media inquiries, contact our communications team.
                </p>
                <a href="mailto:media@mtkenyanews.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                  media@mtkenyanews.com
                </a>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Advertising</h3>
                <p className="text-gray-600 mb-4">
                  Interested in advertising with us? Reach our sales team for custom packages.
                </p>
                <a href="mailto:ads@mtkenyanews.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                  ads@mtkenyanews.com
                </a>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
