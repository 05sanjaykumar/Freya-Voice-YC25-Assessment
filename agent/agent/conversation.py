"""Conversation processing logic - SIMPLIFIED"""
import logging
import asyncio
from livekit import rtc
from livekit.agents import stt as stt_module
from typing import List, Dict

logger = logging.getLogger("voice-agent")


class ConversationHandler:
    """Handles voice conversation loop"""
    
    def __init__(self, stt, llm, tts, vad, audio_source):
        self.stt = stt
        self.llm = llm
        self.tts = tts
        self.vad = vad
        self.audio_source = audio_source
        self.messages: List[Dict[str, str]] = []
    
    def set_system_prompt(self, prompt: str):
        """Set the system prompt"""
        self.messages = [{"role": "system", "content": prompt}]
    
    async def send_greeting(self):
        """Send initial greeting"""
        greeting = "Hello! I'm your AI assistant. How can I help you today?"
        logger.info(f"🤖 {greeting}")
        
        async for chunk in self.tts.synthesize(greeting):
            await self.audio_source.capture_frame(chunk.frame)
        
        logger.info("✅ Greeting sent!")
    
    async def process_user_speech(self, audio_track) -> None:
        """Process continuous user speech - CORRECT API"""
        logger.info("👂 Setting up speech recognition...")
        
        from livekit.agents import stt as stt_module
        
        # Create the adapter
        stream_adapter = stt_module.StreamAdapter(
            stt=self.stt,
            vad=self.vad,
        )
        
        logger.info("✅ StreamAdapter created")
        
        # Get the output stream from adapter
        recognition_stream = stream_adapter.stream()
        
        logger.info("✅ Recognition stream ready, starting audio feed...")
        
        # Create audio stream
        audio_stream = rtc.AudioStream(audio_track)
        
        # Feed audio frames
        async def feed_audio():
            try:
                frame_count = 0
                async for event in audio_stream:
                    # Push to the STREAM, not the adapter
                    recognition_stream.push_frame(event.frame)
                    frame_count += 1
                    if frame_count % 100 == 0:
                        logger.info(f"📊 Fed {frame_count} frames")
            except Exception as e:
                logger.error(f"❌ Audio feed error: {e}")
                import traceback
                traceback.print_exc()
        
        # Start feeding
        feed_task = asyncio.create_task(feed_audio())
        
        # Process speech events
        try:
            logger.info("👂 Listening for speech events...")
            
            async for event in recognition_stream:
                logger.info(f"📢 Event type: {event.type}")
                
                if event.type == stt_module.SpeechEventType.FINAL_TRANSCRIPT:
                    user_text = event.alternatives[0].text if event.alternatives else ""
                    
                    if user_text:
                        logger.info(f"👤 User: {user_text}")
                        await self._generate_and_speak(user_text)
                
                elif event.type == stt_module.SpeechEventType.START_OF_SPEECH:
                    logger.info("🎤 User started speaking")
                
                elif event.type == stt_module.SpeechEventType.END_OF_SPEECH:
                    logger.info("🎤 User stopped speaking")
        
        except Exception as e:
            logger.error(f"❌ Speech error: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            feed_task.cancel()
            await recognition_stream.aclose()
            logger.info("🔇 Speech processing stopped")

        
    async def _generate_and_speak(self, user_text: str):
        """Generate AI response - CORRECT API v1.2.14"""
        try:
            from livekit.agents import llm as llm_module
            
            # Add to history
            self.messages.append({"role": "user", "content": user_text})
            
            logger.info("🧠 Generating response...")
            
            # Create ChatContext
            chat_ctx = llm_module.ChatContext()
            
            # Add messages using .add_message() - NOT .append()!
            for msg in self.messages:
                chat_ctx.add_message(
                    content=msg["content"],  # ✅ Use 'content'
                    role=msg["role"]
                )
            
            # Stream LLM response
            llm_stream = self.llm.chat(chat_ctx=chat_ctx)
            
            # Collect response
            ai_text = ""
            async for chunk in llm_stream:
                if hasattr(chunk, 'content') and chunk.content:
                    ai_text += chunk.content
                elif hasattr(chunk, 'delta') and chunk.delta:
                    # delta is an object, get its content
                    if hasattr(chunk.delta, 'content') and chunk.delta.content:
                        ai_text += chunk.delta.content
            
            if not ai_text:
                logger.warning("⚠️ Empty response from LLM")
                return
            
            logger.info(f"🤖 Agent: {ai_text}")
            self.messages.append({"role": "assistant", "content": ai_text})
            
            # Speak
            logger.info("🔊 Speaking...")
            async for chunk in self.tts.synthesize(ai_text):
                await self.audio_source.capture_frame(chunk.frame)
            
            logger.info("✅ Response complete!")
        
        except Exception as e:
            logger.error(f"❌ Generation error: {e}")
            import traceback
            traceback.print_exc()
