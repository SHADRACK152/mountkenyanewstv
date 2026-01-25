import React from 'react';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-[200px] lg:pt-[220px]">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-black mb-4">Careers at Mount Kenya News</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            We are always looking for talented, passionate individuals to join our team. If you are interested in working with us, please send your CV and a short cover letter to <a href="mailto:careers@mtkenyanews.com" className="underline text-white">careers@mtkenyanews.com</a>.
          </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-6">Current Openings</h2>
        <p className="text-gray-700 mb-8">We currently do not have any open positions. However, you can still send us your CV for future opportunities.</p>
        <a href="mailto:careers@mtkenyanews.com" className="inline-block px-8 py-3 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors">Send Your CV</a>
      </div>
    </div>
  );
}
