'use client';

import { useState } from 'react';
import { Bot, Github, FileText, MessageSquare, BarChart } from 'lucide-react';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) throw new Error('Invalid token');
      window.location.href = '/console';
    } catch {
      setError("Invalid token. Try 'dev' for demo access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 to-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 border-b bg-white shadow-sm">
        <div className="flex items-center space-x-2">
          <Bot className="text-blue-600 w-6 h-6" />
          <span className="font-semibold text-lg">Agent Console</span>
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <a href="/docs" className="hover:text-blue-600 transition">Documentation</a>
          <a href="https://github.com" target="_blank" className="flex items-center hover:text-blue-600 transition">
            <Github className="w-4 h-4 mr-1" /> GitHub
          </a>
          <div className="flex items-center text-green-600 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> System Online
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex flex-1 justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 w-14 h-14 flex items-center justify-center rounded-full bg-blue-100">
            <Bot className="w-8 h-8 text-blue-600" />
          </div>

          {/* Headings */}
          <h1 className="text-2xl font-semibold mb-1">Voice AI Agent Console</h1>
          <p className="text-gray-500 mb-6 text-sm">
            Create custom AI agents and interact in real-time via voice and text
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-left">
            <label className="block text-sm font-medium text-gray-700">Access Token</label>
            <input
              type="text"
              placeholder="Enter token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-xs text-gray-400">Demo: use 'dev'</p>

            {error && (
              <div className="bg-red-100 text-red-700 text-sm p-2 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Authenticating...' : 'Login to Console'}
            </button>
          </form>

          {/* Divider */}
          <div className="border-t my-6"></div>

          {/* What's inside */}
          <p className="text-sm text-gray-500 mb-3">What's inside:</p>
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="flex flex-col items-center">
              <FileText className="w-5 h-5 text-blue-600 mb-1" />
              <span>Prompts</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageSquare className="w-5 h-5 text-blue-600 mb-1" />
              <span>Live Chat</span>
            </div>
            <div className="flex flex-col items-center">
              <BarChart className="w-5 h-5 text-blue-600 mb-1" />
              <span>Analytics</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 mt-6 pb-4">
        <p>Built with Next.js 14, LiveKit, and Groq</p>
        <p>Production-grade • Real-time • Scalable</p>
      </footer>
    </div>
  );
}
