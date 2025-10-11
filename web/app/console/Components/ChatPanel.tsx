// web/app/console/Components/ChatPanel.tsx
import { MessageSquare, X } from 'lucide-react';
import { Prompt } from '../hooks/usePrompts';

interface ChatPanelProps {
  selectedPrompt: Prompt | null;
  onClose: () => void;
}

export default function ChatPanel({ selectedPrompt, onClose }: ChatPanelProps) {
  if (!selectedPrompt) {
    return (
      <main className="flex-1 flex flex-col bg-white">
        <div className="p-6 border-b">
          <h2 className="font-semibold text-gray-800">Select a prompt to start</h2>
          <p className="text-sm text-gray-500">Choose from the library or create a new one</p>
        </div>

        <div className="flex-1 flex items-center justify-center p-10">
          <div className="space-y-3">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-700">No Active Session</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-center">
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
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-white">
      {/* Header with selected prompt details */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-800">{selectedPrompt.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600">{selectedPrompt.body}</p>
        {selectedPrompt.tags.length > 0 && (
          <div className="flex gap-2 mt-3">
            {selectedPrompt.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chat area placeholder */}
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center space-y-3">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto" />
          <h3 className="text-lg font-medium text-gray-700">Ready to Chat</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            LiveKit integration coming next! For now, you can manage your prompts.
          </p>
        </div>
      </div>

      {/* Message input placeholder */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="LiveKit integration in progress..."
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
  );
}
