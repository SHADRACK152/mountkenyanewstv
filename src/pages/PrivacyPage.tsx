import { Shield, Eye, Lock, Database, UserCheck, Mail, AlertCircle } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      icon: Database,
      title: 'Information We Collect',
      content: `We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, comment on articles, or contact us. This may include:
      
• Your name and email address
• Comments and interactions with articles
• Newsletter subscription preferences
• Messages you send through our contact form

We also automatically collect certain information when you visit our website, including your IP address, browser type, pages visited, and time spent on our site.`,
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Send you newsletters and updates (with your consent)
• Respond to your comments, questions, and requests
• Monitor and analyze trends, usage, and activities
• Detect, investigate, and prevent fraudulent transactions and abuse
• Personalize and improve your experience on our website`,
    },
    {
      icon: Lock,
      title: 'Information Sharing',
      content: `We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:

• With your consent or at your direction
• With service providers who assist us in operating our website
• To comply with legal obligations or protect our rights
• In connection with a merger, acquisition, or sale of assets

We ensure that any third parties who receive your information are bound by confidentiality obligations.`,
    },
    {
      icon: Shield,
      title: 'Data Security',
      content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:

• Encryption of data in transit and at rest
• Regular security assessments and updates
• Access controls and authentication measures
• Secure data storage practices

However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`,
    },
    {
      icon: UserCheck,
      title: 'Your Rights',
      content: `You have the right to:

• Access the personal information we hold about you
• Request correction of inaccurate information
• Request deletion of your personal information
• Opt out of marketing communications
• Withdraw consent where we rely on consent to process your data

To exercise any of these rights, please contact us using the information provided below.`,
    },
    {
      icon: Mail,
      title: 'Contact Us',
      content: `If you have any questions about this Privacy Policy or our data practices, please contact us at:

Mount Kenya News
Email: privacy@mtkenyanews.com
Address: Nyeri Town, Kenya

We will respond to your inquiry within 30 days.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-[200px] lg:pt-[220px]">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield size={64} className="mx-auto mb-6 text-blue-300" />
          <h1 className="text-5xl font-black mb-4">Privacy Policy</h1>
          <p className="text-xl text-blue-100">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-blue-200 mt-4">
            Last updated: January 12, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {sections.map((section, index) => (
            <div
              key={index}
              className={`p-8 ${index !== sections.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <section.icon size={24} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notice */}
        <div className="mt-8 p-6 bg-blue-50 rounded-xl flex items-start gap-4">
          <AlertCircle size={24} className="text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-900 mb-2">Changes to This Policy</h3>
            <p className="text-blue-800">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
