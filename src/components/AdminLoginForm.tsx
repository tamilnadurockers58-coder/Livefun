import React, { useState } from 'react';
import { ShieldAlert, Mail, Key, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';

interface AdminLoginFormProps {
  onSuccess: (user: User) => void;
}

export default function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate email and password exactly per requirements
    if (email !== 'maxwellblackey@gmail.com' || password !== 'Muneeswari1@') {
      setTimeout(() => {
        setError('Invalid Admin Credentials');
        setLoading(false);
      }, 400);
      return;
    }

    try {
      const response = await fetch('/api/auth/login-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid Admin Credentials');
      }

      const adminUser = await response.json();
      if (adminUser.role !== 'admin') {
        throw new Error('Invalid Admin Credentials');
      }

      // Successful login
      onSuccess(adminUser);
    } catch (err: any) {
      setError('Invalid Admin Credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-[#17212b]/80 backdrop-blur-xl border border-[#24303f] rounded-2xl p-8 shadow-2xl relative overflow-hidden" id="admin-login-form">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#2481cc]/10 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#2481cc]/10 text-[#2481cc] rounded-full flex items-center justify-center border border-[#2481cc]/20 mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Admin Authentication</h1>
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          Access is restricted to authorized operations managers.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center" id="admin-login-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Admin Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full pl-10 pr-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition"
              id="admin-email-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full pl-10 pr-10 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition"
              id="admin-password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-[#2481cc] hover:bg-[#179cde] disabled:bg-[#2481cc]/50 text-white rounded-xl text-xs font-bold transition duration-200 mt-6"
          id="admin-login-submit-btn"
        >
          {loading ? 'Authenticating...' : 'Sign In as Admin'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-[#24303f]/50 text-center">
        <button
          type="button"
          onClick={() => { window.location.href = '/' }}
          className="text-[11px] text-gray-500 hover:text-[#2481cc] transition"
        >
          Return to Portal Feed
        </button>
      </div>
    </div>
  );
}
