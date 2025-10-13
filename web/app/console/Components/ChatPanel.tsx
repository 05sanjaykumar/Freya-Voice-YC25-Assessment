// web/app/console/Components/ChatPanel.tsx
import { MessageSquare, X, Mic, MicOff, Phone } from 'lucide-react';
import { Prompt } from '../hooks/usePrompts';
import { useLiveKit } from '../hooks/useLiveKit';
import { store } from '@/lib/store';
import { useEffect, useState } from 'react';

interface ChatPanelProps {
  selectedPrompt: Prompt | null;
  onClose: () => void;
}

export default function ChatPanel({ selectedPrompt, onClose }: ChatPanelProps) {
  const {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendTextMessage,
    messages,
    sessionMode,
    setSessionMode,
    isMuted,
    toggleMute,
  } = useLiveKit();

  const [allMessages, setAllMessages] = useState<any[]>([]);

  // Load all past messages when prompt is selected
  useEffect(() => {
    if (selectedPrompt) {
      // Get all sessions for this prompt
      const allSessions = store.getSessions(100);
      const promptSessions = allSessions.filter(s => s.promptId === selectedPrompt.id);
      
      // Collect all messages from all sessions
      const historicalMessages = promptSessions.flatMap(session => 
        session.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          sessionId: session.id
        }))
      );
      
      // Sort by timestamp
      historicalMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setAllMessages(historicalMessages);
      console.log(`📜 Loaded ${historicalMessages.length} past messages for prompt: ${selectedPrompt.title}`);
    }
  }, [selectedPrompt?.id]);

  // Combine historical messages + current session messages
  const displayMessages = [...allMessages, ...messages];

  const handleStartVoiceSession = async () => {
    if (selectedPrompt) {
      setSessionMode('voice');
      await connect(selectedPrompt.id, selectedPrompt.body, 'voice');
    }
  };

  const handleStartTextSession = async () => {
    if (selectedPrompt) {
      setSessionMode('text');
      await connect(selectedPrompt.id, selectedPrompt.body, 'text');
    }
  };

 const handleEndSession = () => {
    disconnect();
  };

  // ✅ Update useEffect to reload when connection changes
  useEffect(() => {
    if (selectedPrompt) {
      const allSessions = store.getSessions(100);
      const promptSessions = allSessions.filter(s => s.promptId === selectedPrompt.id);
      
      const historicalMessages = promptSessions.flatMap(session => 
        session.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          sessionId: session.id
        }))
      );
      
      historicalMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setAllMessages(historicalMessages);
    }
  }, [selectedPrompt?.id, isConnected]);

  if (!selectedPrompt) {
    return (
      <main className="flex-1 flex flex-col bg-white">
        <div className="p-6 border-b">
          <h2 className="font-semibold text-gray-800">Select a prompt to start</h2>
          <p className="text-sm text-gray-500">Choose from the library or create a new one</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="space-y-3 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto" />
            <h3 className="text-lg font-medium text-gray-700">No Active Session</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Select a prompt to start a conversation with your AI agent.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-semibold text-gray-800">{selectedPrompt.title}</h2>
            {displayMessages.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {displayMessages.length} total messages
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600">{selectedPrompt.body}</p>
        {selectedPrompt.tags.length > 0 && (
          <div className="flex gap-2 mt-3">
            {selectedPrompt.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Session Controls */}
        <div className="mt-4 flex gap-3">
          {!isConnected && !isConnecting && (
            <>
              <button
                onClick={handleStartVoiceSession}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Start Voice Session
              </button>

              <button
                onClick={handleStartTextSession}
                className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Start Text Session
              </button>
            </>
          )}

          {isConnecting && (
            <button disabled className="px-6 py-2 bg-gray-300 text-gray-600 rounded-xl cursor-not-allowed">
              Connecting...
            </button>
          )}

          {isConnected && (
            <>
              <button
                onClick={handleEndSession}
                className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                End Session
              </button>

              {sessionMode === 'voice' && (
                <button
                  onClick={toggleMute}
                  className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                    isMuted ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Chat Messages - Shows ALL messages (historical + current) */}
      <div className="flex-1 overflow-y-auto p-6">
        {displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              {isConnected ? (
                <>
                  {sessionMode === 'voice' ? (
                    <>
                      <Mic className="w-16 h-16 text-green-500 mx-auto animate-pulse" />
                      <h3 className="text-lg font-medium text-gray-700">Session Active</h3>
                      <p className="text-gray-500 max-w-sm mx-auto">
                        Start speaking! The AI agent is listening and will respond.
                      </p>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-16 h-16 text-green-500 mx-auto" />
                      <h3 className="text-lg font-medium text-gray-700">Text Session Active</h3>
                      <p className="text-gray-500 max-w-sm mx-auto">
                        You can type your messages below.
                      </p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto" />
                  <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Start a session to begin chatting with this prompt.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {displayMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-4 rounded-xl ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Text Input (only for text session) */}
      {isConnected && sessionMode === 'text' && (
        <div className="border-t p-4 bg-gray-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
              const text = input.value.trim();
              if (text && sendTextMessage) {
                sendTextMessage(text);
                input.value = '';
              }
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              name="message"
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
