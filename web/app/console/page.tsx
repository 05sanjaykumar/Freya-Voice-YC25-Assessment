// web/app/console/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, LogOut, Plus, Search, MessageSquare, BarChart3, Clock } from 'lucide-react';

export default function ConsolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (!res.ok) {
          router.push('/');
        } else {
          setLoading(false);
        }
      } catch {
        router.push('/');
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white border-b shadow-sm px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-lg tracking-tight">Agent Console</span>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Connected</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <aside className="w-80 bg-white border-r flex flex-col">
          <div className="p-6 border-b space-y-4">
            <h2 className="font-semibold flex items-center gap-2 text-gray-800">
              <MessageSquare className="w-5 h-5" />
              Prompt Library
            </h2>
            <button className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium">
              <Plus className="w-4 h-4" />
              New Prompt
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search prompts..."
                className="w-full pl-10 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Prompt List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <div className="text-sm text-gray-500">Your Prompts</div>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                <div className="font-medium text-sm text-gray-700">Loading prompts...</div>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="p-6 border-t space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4" />
              Recent Sessions
            </h3>
            <div className="text-xs text-gray-500">No sessions yet</div>
          </div>
        </aside>

        {/* CENTER PANEL */}
        <main className="flex-1 flex flex-col bg-white">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Select a prompt to start</h2>
              <p className="text-sm text-gray-500">Choose from the library or create a new one</p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center text-center p-10">
            <div className="space-y-3">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-700">No Active Session</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Select a prompt from the library to start a conversation with your AI agent.
              </p>
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Start a session to send messages..."
                disabled
                className="flex-1 px-4 py-2 border rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed"
              />
              <button
                disabled
                className="px-5 py-2 bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="w-80 bg-white border-l overflow-y-auto">
          <div className="p-6 border-b space-y-4">
            <h2 className="font-semibold flex items-center gap-2 text-gray-800">
              <BarChart3 className="w-5 h-5" />
              Performance
            </h2>
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="text-xs text-blue-600 font-medium">Avg First Token</div>
                <div className="text-2xl font-bold text-blue-700">--ms</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <div className="text-xs text-green-600 font-medium">Tokens/Second</div>
                <div className="text-2xl font-bold text-green-700">--</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <div className="text-xs text-purple-600 font-medium">Error Rate</div>
                <div className="text-2xl font-bold text-purple-700">--%</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-3">
            <h3 className="font-semibold text-gray-800">Activity Log</h3>
            <div className="space-y-2 text-sm">
              <div className="text-gray-500 text-xs">No activity yet</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
