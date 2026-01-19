import { Award, Globe, Users, Zap } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

export default function AboutSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-white via-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-in" className="mb-16">
          <div className="text-center">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full mb-4">
              About Mount Kenya News
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Truth, Integrity, Excellence
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Leading Kenya's digital news revolution with fearless journalism and trusted reporting
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection animation="slide-left">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed">
                  To deliver accurate, timely, and comprehensive news coverage that informs, empowers, and unites Kenyans. We believe in the power of quality journalism to drive positive change and hold the powerful accountable.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h3>
                <p className="text-gray-600 leading-relaxed">
                  To be East Africa's most trusted news platform, recognized for investigative excellence, diverse perspectives, and innovative digital storytelling that serves the public interest.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
                  <p className="text-gray-600 text-sm">Journalists & Reporters</p>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="text-4xl font-bold text-red-600 mb-2">2M+</div>
                  <p className="text-gray-600 text-sm">Monthly Readers</p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slide-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: Award,
                  title: 'Award-Winning',
                  description: 'Recognized globally for journalistic excellence and innovation',
                },
                {
                  icon: Zap,
                  title: 'Fast & Accurate',
                  description: 'Real-time coverage with rigorous fact-checking standards',
                },
                {
                  icon: Globe,
                  title: 'Pan-African Reach',
                  description: 'Coverage extending beyond Kenya to the broader African continent',
                },
                {
                  icon: Users,
                  title: 'Community-Focused',
                  description: 'Stories that matter to ordinary Kenyans and their daily lives',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:-translate-y-2 transition-all"
                >
                  <item.icon className="w-12 h-12 text-blue-600 mb-4" />
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
