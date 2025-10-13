// web/app/console/hooks/useLiveKit.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
} from 'livekit-client';
import { store } from '@/lib/store';

export function useLiveKit() {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  
  const sessionIdRef = useRef<string | null>(null);
  const promptIdRef = useRef<string | null>(null);

  // Handle incoming data (transcripts + text responses)
  const handleDataReceived = useCallback(
    (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        
        console.log('📨 Data received:', data);
        
        if (data.type === 'transcript') {
          const newMessage = {
            role: data.role as 'user' | 'assistant',
            content: data.content,
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, newMessage]);
          
          // Save to session store
          if (sessionIdRef.current) {
            store.addMessage(sessionIdRef.current, {
              role: newMessage.role,
              content: newMessage.content,
            });
          }
        }
      } catch (e) {
        console.error('❌ Failed to parse data:', e);
      }
    },
    []
  );

  // Handle incoming audio tracks (agent speaking)
  const handleTrackSubscribed = useCallback(
    (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      console.log('🔊 Track subscribed:', track.kind, 'from', participant.identity);
      
      if (track.kind === Track.Kind.Audio) {
        const audioElement = track.attach();
        audioElement.autoplay = true;
        audioElement.volume = 1.0;
        document.body.appendChild(audioElement);
        console.log('✅ Audio element created and attached');
        
        audioElement.play().catch(e => {
          console.warn('Autoplay blocked, user interaction needed:', e);
        });
      }
    },
    []
  );

  // Send text message via data channel
  const sendTextMessage = useCallback(async (text: string) => {
    if (!room || !isConnected) {
      console.error('❌ Cannot send: not connected');
      return;
    }

    try {
      // Add to local messages immediately (optimistic update)
      const userMessage = {
        role: 'user' as const,
        content: text,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Save to session
      if (sessionIdRef.current) {
        store.addMessage(sessionIdRef.current, {
          role: 'user',
          content: text,
        });
      }

      // Send to agent via data channel
      const data = {
        type: 'text_message',
        content: text,
      };
      
      const encoder = new TextEncoder();
      await room.localParticipant.publishData(
        encoder.encode(JSON.stringify(data)),
        { reliable: true }
      );
      
      console.log('📤 Text message sent:', text);
    } catch (err) {
      console.error('❌ Failed to send text:', err);
      setError('Failed to send message');
    }
  }, [room, isConnected]);

  // Connect to LiveKit room
  const connect = useCallback(async (promptId: string, promptBody: string) => {
    try {
      setIsConnecting(true);
      setError(null);
      setMessages([]);

      // Create session in store
      const session = store.createSession(promptId);
      sessionIdRef.current = session.id;
      promptIdRef.current = promptId;
      
      console.log('📝 Session created:', session.id);

      // Generate unique room name
      const roomName = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const participantName = 'user';

      // Get token from backend
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantName,
          metadata: promptBody,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get LiveKit token');
      }

      const { token, url } = await response.json();

      // Create and connect room
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      // Setup event listeners
      newRoom.on(RoomEvent.Connected, () => {
        console.log('✅ Connected to room');
        setIsConnected(true);
        setIsConnecting(false);
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        console.log('❌ Disconnected from room');
        setIsConnected(false);
        
        // End session in store
        if (sessionIdRef.current) {
          store.endSession(sessionIdRef.current);
          console.log('📝 Session ended:', sessionIdRef.current);
        }
      });

      newRoom.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      newRoom.on(RoomEvent.DataReceived, handleDataReceived);

      // Connect to room
      await newRoom.connect(url, token);
      
      // Enable microphone
      await newRoom.localParticipant.setMicrophoneEnabled(true);
      console.log('🎤 Microphone enabled');
      
      setRoom(newRoom);

      return newRoom;
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnecting(false);
      
      // Clean up failed session
      if (sessionIdRef.current) {
        store.endSession(sessionIdRef.current);
      }
      
      return null;
    }
  }, [handleTrackSubscribed, handleDataReceived]);

  // Disconnect from room
  const disconnect = useCallback(() => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setIsConnected(false);
      
      // End session
      if (sessionIdRef.current) {
        store.endSession(sessionIdRef.current);
        sessionIdRef.current = null;
      }
      
      setMessages([]);
    }
  }, [room]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
        if (sessionIdRef.current) {
          store.endSession(sessionIdRef.current);
        }
      }
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
  };
}
