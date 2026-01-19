import { Smartphone, Target, Lightbulb, Shield, Zap, BookOpen } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

const features = [
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description: 'Optimized experience across all devices with seamless navigation and fast loading times',
  },
  {
    icon: Target,
    title: 'Personalized Content',
    description: 'AI-powered recommendations tailored to your interests and reading habits',
  },
  {
    icon: Lightbulb,
    title: 'Deep Investigations',
    description: 'Exclusive investigative reports uncovering stories that matter to Kenyans',
  },
  {
    icon: Shield,
    title: 'Verified News',
    description: 'Every story fact-checked and verified by our team of experienced journalists',
  },
  {
    icon: Zap,
    title: 'Breaking Alerts',
    description: 'Instant notifications for important news before it breaks elsewhere',
  },
  {
    icon: BookOpen,
    title: 'In-Depth Analysis',
    description: 'Expert commentary and analysis on politics, business, and social issues',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-in" className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">
            Our Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose Mount Kenya News
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive coverage with the features modern news consumers demand
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <AnimatedSection
              key={index}
              animation="slide-up"
              delay={index * 100}
              className="h-full"
            >
              <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all p-8 border border-gray-100 hover:border-blue-200 group h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
                <div className="h-1 w-0 bg-gradient-to-r from-blue-600 to-red-600 mt-4 group-hover:w-full transition-all" />
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
