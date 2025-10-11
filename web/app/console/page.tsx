// web/app/console/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrompts, Prompt } from './hooks/usePrompts';
import Navbar from './Components/Navbar';
import PromptSidebar from './Components/PromptSidebar';
import ChatPanel from './Components/ChatPanel';
import MetricsPanel from './Components/MetricsPanel';
import PromptModal from './Components/PromptModal';

export default function ConsolePage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    prompts,
    loading: promptsLoading,
    fetchPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
  } = usePrompts();

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (!res.ok) router.push('/');
        else setAuthLoading(false);
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchPrompts(query);
  };

  const handleNewPrompt = () => {
    setEditingPrompt(null);
    setShowModal(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setShowModal(true);
  };

  const handleModalSubmit = async (data: { title: string; body: string; tags: string[] }) => {
    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, data);
    } else {
      await createPrompt(data);
    }
    setShowModal(false);
    setEditingPrompt(null);
  };

  const handleDeletePrompt = async (id: string) => {
    await deletePrompt(id);
    if (selectedPrompt?.id === id) {
      setSelectedPrompt(null);
    }
  };

  if (authLoading || promptsLoading) {
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
      <Navbar onLogout={handleLogout} />

      <div className="flex flex-1 overflow-hidden">
        <PromptSidebar
          prompts={prompts}
          selectedPrompt={selectedPrompt}
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onSelectPrompt={setSelectedPrompt}
          onNewPrompt={handleNewPrompt}
          onEditPrompt={handleEditPrompt}
          onDeletePrompt={handleDeletePrompt}
        />

        <ChatPanel
          selectedPrompt={selectedPrompt}
          onClose={() => setSelectedPrompt(null)}
        />

        <MetricsPanel />
      </div>

      <PromptModal
        isOpen={showModal}
        editingPrompt={editingPrompt}
        onClose={() => {
          setShowModal(false);
          setEditingPrompt(null);
        }}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
