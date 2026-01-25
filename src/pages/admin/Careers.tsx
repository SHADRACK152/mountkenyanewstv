import React, { useEffect, useState } from 'react';
import { FileText, Mail, User, Download } from 'lucide-react';

// Dummy data for demonstration
const dummyApplications = [
  {
    id: 1,
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '0712345678',
    cvUrl: '/uploads/cv/jane_doe_cv.pdf',
    message: 'Experienced journalist interested in joining your newsroom.'
  },
  {
    id: 2,
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '0722123456',
    cvUrl: '/uploads/cv/john_smith_cv.pdf',
    message: 'Skilled photographer with 5 years experience.'
  }
];

export default function AdminCareers() {
  const [applications, setApplications] = useState(dummyApplications);

  // In a real app, fetch applications from API here
  useEffect(() => {
    // fetch('/api/careers').then(...)
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText size={24} /> Career Applications
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr>
              <th className="py-3 px-4 border-b text-left">Name</th>
              <th className="py-3 px-4 border-b text-left">Email</th>
              <th className="py-3 px-4 border-b text-left">Phone</th>
              <th className="py-3 px-4 border-b text-left">Message</th>
              <th className="py-3 px-4 border-b text-left">CV</th>
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
                  <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 flex items-center gap-1">
                    <Download size={16} /> Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
