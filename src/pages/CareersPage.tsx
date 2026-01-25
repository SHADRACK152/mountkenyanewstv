import React, { useState } from 'react';

export default function CareersPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    cv: null as File | null,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, cv: e.target.files ? e.target.files[0] : null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    const data = new FormData();
    data.append('name', form.name);
    data.append('email', form.email);
    data.append('phone', form.phone);
    data.append('message', form.message);
    if (form.cv) data.append('cv', form.cv);
    try {
      const res = await fetch('/api/careers', {
        method: 'POST',
        body: data,
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to submit');
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '', cv: null });
    } catch (err: any) {
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[200px] lg:pt-[220px]">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-black mb-4">Careers at Mount Kenya News</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            We are always looking for talented, passionate individuals to join our team. Apply below!
          </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Submit Your Application</h2>
        {status === 'success' ? (
          <div className="bg-green-100 text-green-800 p-6 rounded-lg text-center font-semibold mb-8">Application submitted! We will contact you if shortlisted.</div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8 space-y-6">
            {status === 'error' && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required className="w-full border px-4 py-2 rounded" />
              </div>
              <div>
                <label className="block mb-2 font-medium">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full border px-4 py-2 rounded" />
              </div>
              <div>
                <label className="block mb-2 font-medium">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="w-full border px-4 py-2 rounded" />
              </div>
              <div>
                <label className="block mb-2 font-medium">CV (PDF/DOC) *</label>
                <input name="cv" type="file" accept=".pdf,.doc,.docx" onChange={handleFile} required className="w-full" />
              </div>
            </div>
            <div>
              <label className="block mb-2 font-medium">Message</label>
              <textarea name="message" value={form.message} onChange={handleChange} rows={4} className="w-full border px-4 py-2 rounded" />
            </div>
            <button type="submit" disabled={status === 'loading'} className="w-full py-3 bg-blue-700 text-white rounded font-bold hover:bg-blue-800 transition">
              {status === 'loading' ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
