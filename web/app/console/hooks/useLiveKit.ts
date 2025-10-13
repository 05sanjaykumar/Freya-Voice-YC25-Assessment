import { useState, useCallback, useEffect, useRef } from 'react';
import { Room, RoomEvent, RemoteParticipant, RemoteTrack, RemoteTrackPublication, Track } from 'livekit-client';
import { store } from '@/lib/store';

export function useLiveKit() {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [sessionMode, setSessionMode] = useState<'voice' | 'text' | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const sessionIdRef = useRef<string | null>(null);

  

  const toggleMute = () => {
    if (room && sessionMode === 'voice') {
      const enabled = !isMuted;
      room.localParticipant.setMicrophoneEnabled(enabled);
      setIsMuted(!isMuted);
    }
  };

  const lastUserMessageTime = useRef<number | null>(null);

  // Handle incoming data (transcripts)
  const handleDataReceived = useCallback(
    (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);

        if (data.type === 'transcript') {
          const now = Date.now();
          
          // Calculate latency for assistant messages
          let latency: number | undefined;
          if (data.role === 'assistant' && lastUserMessageTime.current) {
            latency = now - lastUserMessageTime.current;
            console.log('⏱️ First token latency:', latency, 'ms');
          }

          // Update timestamp for user messages
          if (data.role === 'user') {
            lastUserMessageTime.current = now;
          }

          const newMessage = {
            role: data.role as 'user' | 'assistant',
            content: data.content,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, newMessage]);

          // Save to store with metrics
          if (sessionIdRef.current) {
            const messageWithMetrics = {
              role: newMessage.role,
              content: newMessage.content,
              latency: latency,
            };
            
            store.addMessage(sessionIdRef.current, messageWithMetrics);

            // Update session metrics
            if (latency && data.role === 'assistant') {
              // Approximate tokens (words * 1.3 for subword tokens)
              const approxTokens = Math.round(data.content.split(/\s+/).length * 1.3);
              const tokensPerSec = Math.round((approxTokens / latency) * 1000);
              
              store.updateSessionMetrics(sessionIdRef.current, {
                avgFirstTokenLatency: latency,
                avgTokensPerSec: tokensPerSec > 0 ? tokensPerSec : 25,
              });
              
              console.log('📊 Metrics updated:', { latency, tokensPerSec });
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse data:', e);
        
        // Track errors
        if (sessionIdRef.current) {
          const session = store.getSession(sessionIdRef.current);
          if (session) {
            store.updateSessionMetrics(sessionIdRef.current, {
              errorCount: (session.metrics.errorCount || 0) + 1,
            });
          }
        }
      }
    },
    []
  );


  // Handle audio track for voice
  const handleTrackSubscribed = useCallback(
    (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      if (track.kind === Track.Kind.Audio) {
        const audioElement = track.attach();
        audioElement.autoplay = true;
        audioElement.volume = 1.0;
        document.body.appendChild(audioElement);
        audioElement.play().catch(() => {});
      }
    },
    []
  );

  const sendTextMessage = useCallback(async (text: string) => {
    if (!room || !isConnected) return;

    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }]);

    if (sessionIdRef.current) {
      store.addMessage(sessionIdRef.current, { role: 'user', content: text });
    }

    const encoder = new TextEncoder();
    await room.localParticipant.publishData(
      encoder.encode(JSON.stringify({ type: 'text_message', content: text })),
      { reliable: true }
    );
  }, [room, isConnected]);

  const connect = useCallback(
    async (promptId: string, promptBody: string, mode: 'voice' | 'text') => {
      try {
        setIsConnecting(true);
        setError(null);
        setMessages([]);

        const session = store.createSession(promptId);
        sessionIdRef.current = session.id;

        const roomName = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const participantName = 'user';

        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName, participantName, metadata: promptBody, mode }),
        });

        if (!res.ok) throw new Error('Failed to get LiveKit token');

        const { token, url } = await res.json();

        const newRoom = new Room({ adaptiveStream: true, dynacast: true });
        newRoom.on(RoomEvent.Connected, () => { setIsConnected(true); setIsConnecting(false); });
        newRoom.on(RoomEvent.Disconnected, () => { setIsConnected(false); if (sessionIdRef.current) store.endSession(sessionIdRef.current); });
        newRoom.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        newRoom.on(RoomEvent.DataReceived, handleDataReceived);

        await newRoom.connect(url, token);

        if (mode === 'voice') {
          await newRoom.localParticipant.setMicrophoneEnabled(true);
          setIsMuted(false);
        }

        setRoom(newRoom);
        setSessionMode(mode);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Connection failed');
        setIsConnecting(false);
      }
    },
    [handleDataReceived, handleTrackSubscribed]
  );

    const loadSession = useCallback((sessionId: string) => {
    const session = store.getSession(sessionId);
    if (session) {
      // Load messages from stored session
      const loadedMessages = session.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(loadedMessages);
      sessionIdRef.current = sessionId;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setIsConnected(false);
      // setMessages([]);
      if (sessionIdRef.current) store.endSession(sessionIdRef.current);
      sessionIdRef.current = null;
      setSessionMode(null);
      setIsMuted(false);
    }
  }, [room]);

  useEffect(() => {
    return () => {
      if (room) room.disconnect();
    };
  }, [room]);

  return {
    room,
    isConnected,
    isConnecting,
    error,
    messages,
    connect,
    disconnect,
    sendTextMessage,
    sessionMode,
    setSessionMode,
    isMuted,
    toggleMute,
    loadSession,
    sessionId: sessionIdRef.current,
  };
}
