import { FileText, CheckCircle, XCircle, AlertTriangle, Scale, Copyright, Users } from 'lucide-react';

export default function TermsPage() {
  const sections = [
    {
      icon: CheckCircle,
      title: 'Acceptance of Terms',
      content: `By accessing and using the Mount Kenya News website ("Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.

These terms apply to all visitors, users, and others who access or use the Service. By using our website, you warrant that you are at least 18 years of age or have parental consent.`,
    },
    {
      icon: FileText,
      title: 'Use of Content',
      content: `All content on Mount Kenya News, including articles, images, graphics, and other materials, is protected by copyright and other intellectual property laws.

You may:
• Read and share articles via social media using our share buttons
• Quote brief excerpts with proper attribution
• Link to our articles from your website

You may not:
• Reproduce entire articles without written permission
• Modify, adapt, or create derivative works
• Use our content for commercial purposes without authorization
• Remove any copyright or proprietary notices`,
    },
    {
      icon: Users,
      title: 'User Conduct',
      content: `When interacting with our Service (commenting, subscribing, etc.), you agree to:

• Provide accurate and complete information
• Not post false, misleading, or defamatory content
• Not harass, abuse, or harm other users
• Not spam or post promotional content without permission
• Not attempt to gain unauthorized access to our systems
• Not violate any applicable laws or regulations

We reserve the right to remove any content that violates these terms and to suspend or terminate accounts of users who violate these guidelines.`,
    },
    {
      icon: AlertTriangle,
      title: 'Disclaimer of Warranties',
      content: `Mount Kenya News is provided "as is" and "as available" without any warranties of any kind, either express or implied.

We do not warrant that:
• The Service will be uninterrupted or error-free
• The content is accurate, complete, or current
• The Service will meet your specific requirements
• Any errors will be corrected

While we strive for accuracy in our reporting, we cannot guarantee that all information is error-free. We encourage readers to verify important information through multiple sources.`,
    },
    {
      icon: Scale,
      title: 'Limitation of Liability',
      content: `To the fullest extent permitted by law, Mount Kenya News and its affiliates, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:

• Your use or inability to use the Service
• Any content obtained from the Service
• Unauthorized access to your data
• Any third-party conduct on the Service

Our total liability shall not exceed the amount you have paid to us (if any) in the past twelve months.`,
    },
    {
      icon: Copyright,
      title: 'Intellectual Property',
      content: `The Mount Kenya News name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Mount Kenya News. You may not use these marks without our prior written permission.

All other names, logos, product and service names, designs, and slogans on this website are the trademarks of their respective owners.

If you believe any content on our site infringes your copyright, please contact us at legal@mtkenyanews.com with details of the alleged infringement.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-[200px] lg:pt-[220px]">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FileText size={64} className="mx-auto mb-6 text-blue-300" />
          <h1 className="text-5xl font-black mb-4">Terms of Service</h1>
          <p className="text-xl text-blue-100">
            Please read these terms carefully before using our website.
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

        {/* Additional Terms */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-gray-100 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">Governing Law</h3>
            <p className="text-gray-600">
              These Terms shall be governed by and construed in accordance with the laws of Kenya, 
              without regard to its conflict of law provisions.
            </p>
          </div>
          <div className="bg-gray-100 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">Changes to Terms</h3>
            <p className="text-gray-600">
              We reserve the right to modify these terms at any time. Continued use of the Service 
              after changes constitutes acceptance of the new terms.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 p-6 bg-blue-50 rounded-xl text-center">
          <h3 className="font-bold text-blue-900 mb-2">Questions About These Terms?</h3>
          <p className="text-blue-800 mb-4">
            If you have any questions about these Terms of Service, please contact us.
          </p>
          <a
            href="#contact"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
