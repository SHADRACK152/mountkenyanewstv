import { Users, Target, Award, Globe, Mail, MapPin, Phone } from 'lucide-react';

export default function AboutPage() {
  const team = [
    {
      name: 'Editorial Team',
      role: 'News & Content',
      image: 'https://ui-avatars.com/api/?name=Editorial+Team&background=1e40af&color=fff&size=200',
      description: 'Our dedicated editorial team works around the clock to bring you accurate and timely news.',
    },
    {
      name: 'Investigative Unit',
      role: 'Investigations',
      image: 'https://ui-avatars.com/api/?name=Investigative+Unit&background=dc2626&color=fff&size=200',
      description: 'Deep-dive investigations that hold power accountable and uncover the truth.',
    },
    {
      name: 'County Correspondents',
      role: 'Regional Coverage',
      image: 'https://ui-avatars.com/api/?name=County+Team&background=059669&color=fff&size=200',
      description: 'Reporters across all 47 counties bringing you local news that matters.',
    },
  ];

  const values = [
    {
      icon: Target,
      title: 'Accuracy First',
      description: 'We verify every story before publishing. Truth is our foundation.',
    },
    {
      icon: Award,
      title: 'Independence',
      description: 'We report without fear or favor. Our loyalty is to our readers.',
    },
    {
      icon: Globe,
      title: 'Accessibility',
      description: 'News should be accessible to everyone. We break down complex issues.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'We serve the Mt. Kenya region and all Kenyans with dedication.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-[200px] lg:pt-[220px]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-red-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-24 h-24 rounded-full shadow-lg mx-auto mb-6 p-2 overflow-hidden flex items-center justify-center" style={{backgroundColor: '#ffffff'}}>
            <img src="/mtker.png" alt="Mount Kenya News" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-5xl font-black mb-6">About Mount Kenya News</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Your trusted source for news and information from the Mt. Kenya region and beyond. 
            We are committed to truthful, accurate, and timely journalism.
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-blue-900 mb-4">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                To provide accurate, fair, and comprehensive news coverage that informs, 
                educates, and empowers our readers. We believe in the power of journalism 
                to strengthen democracy and hold the powerful accountable.
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-red-900 mb-4">Our Vision</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                To be the most trusted and respected news source in Kenya, known for 
                our integrity, innovation, and commitment to the communities we serve. 
                We aspire to set the standard for digital journalism in East Africa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon size={32} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Our Story</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              Mount Kenya News was founded with a simple but powerful mission: to give voice to 
              the people of the Mt. Kenya region and Kenya at large. In an era of information 
              overload and fake news, we saw the need for a trusted, reliable news source.
            </p>
            <p>
              Our team comprises experienced journalists, editors, and digital media experts 
              who share a passion for truth-telling and public service journalism. We cover 
              politics, business, sports, entertainment, and everything that matters to Kenyans.
            </p>
            <p>
              Today, we reach thousands of readers daily through our website and social media 
              platforms. We continue to grow, innovate, and improve our coverage to serve you better.
            </p>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Team</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-900 to-red-900 flex items-center justify-center">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-red-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="py-16 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Get In Touch</h2>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-3">
              <Mail size={24} className="text-blue-300" />
              <span>info@mtkenyanews.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={24} className="text-blue-300" />
              <span>0722 686 392</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={24} className="text-blue-300" />
              <span>Witeithie, Thika, Kenya</span>
            </div>
          </div>
          <a
            href="#contact"
            className="inline-block mt-8 px-8 py-3 bg-white text-blue-900 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
