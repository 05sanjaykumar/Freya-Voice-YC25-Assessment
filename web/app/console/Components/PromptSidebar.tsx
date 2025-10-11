// web/app/console/Components/PromptSidebar.tsx
import { MessageSquare, Plus, Search, Clock, Edit2, Trash2 } from 'lucide-react';
import { Prompt } from '../hooks/usePrompts';

interface PromptSidebarProps {
  prompts: Prompt[];
  selectedPrompt: Prompt | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectPrompt: (prompt: Prompt) => void;
  onNewPrompt: () => void;
  onEditPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (id: string) => void;
}

export default function PromptSidebar({
  prompts,
  selectedPrompt,
  searchQuery,
  onSearchChange,
  onSelectPrompt,
  onNewPrompt,
  onEditPrompt,
  onDeletePrompt,
}: PromptSidebarProps) {
  return (
    <aside className="w-80 bg-white border-r flex flex-col">
      {/* Header */}
      <div className="p-6 border-b space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-gray-800">
          <MessageSquare className="w-5 h-5" />
          Prompt Library
        </h2>
        <button
          onClick={onNewPrompt}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          New Prompt
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Prompt List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        <div className="text-sm text-gray-500">
          {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
        </div>
        {prompts.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">
            No prompts yet. Create one to get started!
          </div>
        ) : (
          <div className="space-y-2">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`p-3 rounded-lg cursor-pointer transition group ${
                  selectedPrompt?.id === prompt.id
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => onSelectPrompt(prompt)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="font-medium text-sm text-gray-800 flex-1">
                    {prompt.title}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPrompt(prompt);
                      }}
                      className="p-1 hover:bg-white rounded"
                    >
                      <Edit2 className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePrompt(prompt.id);
                      }}
                      className="p-1 hover:bg-white rounded"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {prompt.body}
                </div>
                {prompt.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {prompt.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
  );
}
