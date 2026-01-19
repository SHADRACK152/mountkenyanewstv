import { useState } from 'react';
import { adminLogin } from '../lib/api';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { token } = await adminLogin(username, password);
      localStorage.setItem('admin_token', token);
      window.location.hash = '#admin';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full shadow-lg border-2 border-gray-200 p-1 overflow-hidden flex items-center justify-center mb-4" style={{backgroundColor: '#ffffff'}}>
            <img src="/mtker.png" alt="Mount Kenya News" className="w-16 h-16 object-contain" />
          </div>
          <h2 className="text-2xl font-bold">Admin Login</h2>
          <p className="text-gray-500 text-sm">Mount Kenya News</p>
        </div>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        <input className="w-full mb-3 p-3 border rounded" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" className="w-full mb-3 p-3 border rounded" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white p-3 rounded">Sign In</button>
      </form>
    </div>
  );
}
