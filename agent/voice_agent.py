"""Main voice agent implementation"""
import asyncio
import logging
from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext
from livekit.plugins import groq, silero, cartesia

from agent.conversation import ConversationHandler
from agent.config import config

logger = logging.getLogger("voice-agent")


class VoiceAgent:
    """Voice agent handling LiveKit connection and conversation"""

    def __init__(self, ctx: JobContext):
        self.ctx = ctx
        self.system_prompt = ctx.room.metadata or config.DEFAULT_PROMPT
        self.conversation: ConversationHandler | None = None

    async def start(self):
        """Start the agent pipeline"""
        logger.info(f"🚀 Starting agent for room: {self.ctx.room.name}")
        logger.info(f"📝 System prompt: {self.system_prompt[:50]}...")

        # Connect to room
        await self.ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
        logger.info("✅ Connected to room")

        # Initialize AI components
        await self._initialize_components()

        # Wait for participant
        await self.ctx.wait_for_participant()
        logger.info("👤 Participant joined!")

        # Setup audio output
        audio_source = await self._setup_audio_output()

        # Create conversation handler
        self.conversation = ConversationHandler(
            stt=self.stt,
            llm=self.llm,
            tts=self.tts,
            vad=self.vad,
            audio_source=audio_source,
            room=self.ctx.room
        )
        self.conversation.set_system_prompt(self.system_prompt)

        # Subscribe to participant audio tracks dynamically
        self.ctx.room.on(rtc.RoomEvent.ParticipantConnected, self._subscribe_participant_audio)

        # Start conversation loop
        await self._run_conversation()

    async def _initialize_components(self):
        """Load AI modules"""
        logger.info("🔧 Initializing AI components...")
        self.vad = silero.VAD.load()
        self.stt = groq.STT()
        self.llm = groq.LLM(model=config.LLM_MODEL)
        self.tts = cartesia.TTS()
        logger.info("✅ AI components ready")

    async def _setup_audio_output(self):
        """Setup the agent's TTS audio track"""
        audio_source = rtc.AudioSource(config.AUDIO_SAMPLE_RATE, config.AUDIO_CHANNELS)
        audio_track = rtc.LocalAudioTrack.create_audio_track("agent-voice", audio_source)
        options = rtc.TrackPublishOptions()
        options.source = rtc.TrackSource.SOURCE_MICROPHONE
        await self.ctx.room.local_participant.publish_track(audio_track, options)
        logger.info("🔊 Audio output ready")
        return audio_source

    async def _subscribe_participant_audio(self, participant: rtc.RemoteParticipant):
        """Subscribe to audio tracks from participants"""
        for track_pub in participant.track_publications.values():
            if track_pub.kind == rtc.TrackKind.KIND_AUDIO:
                if not track_pub.subscribed:
                    track_pub.set_subscribed(True)
                await self.conversation.start_processing_audio(track_pub.track)

    async def _run_conversation(self):
        """Start conversation processing for already-connected participants"""
        for participant in self.ctx.room.remote_participants.values():
            await self._subscribe_participant_audio(participant)
