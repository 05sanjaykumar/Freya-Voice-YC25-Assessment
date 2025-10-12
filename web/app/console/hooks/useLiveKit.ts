// web/app/console/hooks/useLiveKit.ts
import { useState, useCallback, useEffect } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
} from 'livekit-client';

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

  // Handle incoming audio tracks (agent speaking) - MOVED UP!
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
        console.log('✅ Audio element created and attached:', audioElement);
        
        // Force play (in case autoplay is blocked)
        audioElement.play().catch(e => {
          console.warn('Autoplay blocked, user interaction needed:', e);
        });
      }
    },
    []
  );

  // Connect to LiveKit room
  const connect = useCallback(async (promptId: string, promptBody: string) => {
    try {
      setIsConnecting(true);
      setError(null);

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
      });

      newRoom.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);

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
      return null;
    }
  }, [handleTrackSubscribed]); // Add dependency!

  // Disconnect from room
  const disconnect = useCallback(() => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setMessages([]);
    }
  }, [room]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
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
  };
}
