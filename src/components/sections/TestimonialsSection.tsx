import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

const testimonials = [
  {
    name: 'Dr. Margaret Omondi',
    role: 'University Professor',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
    text: 'Mount Kenya News provides the most balanced and thorough coverage of political events. I recommend it to all my students.',
    rating: 5,
  },
  {
    name: 'Samuel Kiplagat',
    role: 'Business Owner',
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    text: 'The business section keeps me updated on market trends and economic policies affecting my enterprise. Invaluable resource.',
    rating: 5,
  },
  {
    name: 'Grace Wanjiru',
    role: 'Journalist',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
    text: 'As a fellow journalist, I appreciate their investigative depth and commitment to accuracy. True industry leaders.',
    rating: 5,
  },
  {
    name: 'James Mwangi',
    role: 'Tech Entrepreneur',
    image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
    text: 'The tech and startup coverage is phenomenal. They cover stories others miss. Highly recommended!',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const goToPrevious = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-in" className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            What Readers Say
          </h2>
          <p className="text-xl text-gray-600">
            Join thousands of Kenyans who trust Mount Kenya News daily
          </p>
        </AnimatedSection>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              <div className="flex">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow p-8 md:p-12">
                      <div className="flex items-center mb-6">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-16 h-16 rounded-full border-2 border-blue-600 object-cover"
                        />
                        <div className="ml-4">
                          <h3 className="text-lg font-bold text-gray-900">{testimonial.name}</h3>
                          <p className="text-gray-600">{testimonial.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-5 h-5 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>

                      <p className="text-gray-700 text-lg leading-relaxed italic">
                        "{testimonial.text}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={goToPrevious}
            className="absolute -left-4 md:-left-16 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all z-10"
          >
            <ChevronLeft className="w-6 h-6 text-blue-600" />
          </button>

          <button
            onClick={goToNext}
            className="absolute -right-4 md:-right-16 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all z-10"
          >
            <ChevronRight className="w-6 h-6 text-blue-600" />
          </button>

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setAutoPlay(false);
                  setCurrentIndex(index);
                }}
                className={`h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-blue-600'
                    : 'w-3 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
