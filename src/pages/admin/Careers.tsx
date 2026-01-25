import React, { useEffect, useState } from 'react';
import { FileText, Mail, Download } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

export default function AdminCareers() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch(`${API}/api/admin/careers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch');
        setApplications(await res.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText size={24} /> Career Applications
      </h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      ) : applications.length === 0 ? (
        <div className="text-gray-500">No applications yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead>
              <tr>
                <th className="py-3 px-4 border-b text-left">Name</th>
                <th className="py-3 px-4 border-b text-left">Email</th>
                <th className="py-3 px-4 border-b text-left">Phone</th>
                <th className="py-3 px-4 border-b text-left">Message</th>
                <th className="py-3 px-4 border-b text-left">CV</th>
                <th className="py-3 px-4 border-b text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{app.name}</td>
                  <td className="py-2 px-4">
                    <a href={`mailto:${app.email}`} className="text-blue-600 underline flex items-center gap-1"><Mail size={16} />{app.email}</a>
                  </td>
                  <td className="py-2 px-4">{app.phone}</td>
                  <td className="py-2 px-4">{app.message}</td>
                  <td className="py-2 px-4">
                    {app.cv_url ? (
                      <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 flex items-center gap-1">
                        <Download size={16} /> Download
                      </a>
                    ) : (
                      <span className="text-gray-400">No CV</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-xs text-gray-500">{new Date(app.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
