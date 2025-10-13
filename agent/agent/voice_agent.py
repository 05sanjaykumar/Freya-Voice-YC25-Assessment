# agent/agent/voice_agent.py
"""Main voice agent implementation"""
import asyncio
import logging
from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext
from livekit.plugins import groq, silero, cartesia

from .conversation import ConversationHandler
from . import config

logger = logging.getLogger("voice-agent")

class VoiceAgent:
    """Main voice agent that handles LiveKit connection and conversation"""
    
    def __init__(self, ctx: JobContext):
        self.ctx = ctx
        self.system_prompt = ctx.room.metadata or config.DEFAULT_PROMPT
        self.conversation = None
        self.background_tasks = set()  # Prevent task garbage collection
    
    async def start(self):
        """Start the agent"""
        logger.info(f"🚀 Starting agent for room: {self.ctx.room.name}")
        logger.info(f"📝 System prompt: {self.system_prompt[:50]}...")
        
        # Connect to room
        await self.ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
        logger.info("✅ Agent connected to room")
        
        # Initialize AI components
        await self._initialize_components()
        
        # Wait for user
        logger.info("⏳ Waiting for user to join...")
        await self.ctx.wait_for_participant()
        logger.info("👤 User joined!")
        
        # Setup audio output
        audio_source = await self._setup_audio_output()
        
        # Create conversation handler (BEFORE event listener!)
        self.conversation = ConversationHandler(
            stt=self.stt,
            llm=self.llm,
            tts=self.tts,
            vad=self.vad,
            audio_source=audio_source,
            room=self.ctx.room  # Pass room reference
        )
        self.conversation.set_system_prompt(self.system_prompt)
        
        # NOW register event listener (conversation exists!)
        @self.ctx.room.on("data_received")
        def on_data(data: bytes, participant):
            import json
            try:
                message = json.loads(data.decode('utf-8'))
                if message.get('type') == 'text_message':
                    task = asyncio.create_task(
                        self.conversation.handle_text_message(message['content'])
                    )
                    # Keep reference to prevent garbage collection
                    self.background_tasks.add(task)
                    task.add_done_callback(self.background_tasks.discard)
            except Exception as e:
                logger.error(f"❌ Data error: {e}")
        
        # Start conversation
        await self._run_conversation()
    
    async def _initialize_components(self):
        """Initialize AI components"""
        logger.info("🔧 Initializing AI components...")
        
        self.vad = silero.VAD.load()
        logger.info("✅ VAD loaded")
        
        self.stt = groq.STT()
        logger.info("✅ STT ready")
        
        self.llm = groq.LLM(model=config.LLM_MODEL)
        logger.info(f"✅ LLM ready ({config.LLM_MODEL})")
        
        self.tts = cartesia.TTS()
        logger.info("✅ TTS ready (Cartesia)")
    
    async def _setup_audio_output(self):
        """Setup audio output track"""
        logger.info("🔊 Setting up audio output...")
        
        audio_source = rtc.AudioSource(config.AUDIO_SAMPLE_RATE, config.AUDIO_CHANNELS)
        audio_track = rtc.LocalAudioTrack.create_audio_track("agent-voice", audio_source)
        
        options = rtc.TrackPublishOptions()
        options.source = rtc.TrackSource.SOURCE_MICROPHONE
        await self.ctx.room.local_participant.publish_track(audio_track, options)
        
        logger.info("✅ Audio output ready")
        return audio_source
    
    async def _run_conversation(self):
        """Run the conversation loop"""
        # Get user's audio track
        user = list(self.ctx.room.remote_participants.values())[0]
        logger.info(f"👤 Listening to: {user.identity}")
        
        user_audio_track = None
        for track_pub in user.track_publications.values():
            if track_pub.kind == rtc.TrackKind.KIND_AUDIO:
                if not track_pub.subscribed:
                    track_pub.set_subscribed(True)
                user_audio_track = track_pub.track
                break
        
        if not user_audio_track:
            logger.error("❌ No audio track found!")
            return
        
        # Send greeting
        await self.conversation.send_greeting()
        
        # Start listening
        await self.conversation.process_user_speech(user_audio_track)
