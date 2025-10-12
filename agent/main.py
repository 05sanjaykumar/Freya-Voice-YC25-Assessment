import os
import logging
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
)
import asyncio
from livekit.plugins import groq, silero, cartesia

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")


async def entrypoint(ctx: JobContext):
    """
    Voice agent using built-in VoiceAssistant helper.
    """
    logger.info(f"🚀 Starting agent for room: {ctx.room.name}")
    
    # Get system prompt
    system_prompt = ctx.room.metadata or "You are a helpful AI assistant."
    logger.info(f"📝 System prompt: {system_prompt[:50]}...")
    
    # Connect to room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info("✅ Agent connected to room")
    
        # === STEP 1: Initialize AI Components ===
    logger.info("🔧 Initializing AI components...")

    # Voice Activity Detection - detects when user speaks
    vad = silero.VAD.load()
    logger.info("✅ VAD loaded")

    # Speech-to-Text - converts voice to text
    stt = groq.STT()
    logger.info("✅ STT ready")

    # Language Model - generates responses
    llm_instance = groq.LLM(model="llama3-70b-8192")
    logger.info("✅ LLM ready")

    # Text-to-Speech - converts text to voice
    tts = cartesia.TTS()
    logger.info("✅ TTS ready (Groq PlayAI)")


        # === STEP 2: Wait for User to Join ===
    logger.info("⏳ Waiting for user to join...")
    await ctx.wait_for_participant()
    logger.info("👤 User joined! Starting conversation...")

    # === STEP 3: Create Audio Output for Agent's Voice ===
    logger.info("🔊 Setting up audio output...")

    # Create audio source (24kHz, mono)
    audio_source = rtc.AudioSource(24000, 1)

    # Create audio track
    audio_track = rtc.LocalAudioTrack.create_audio_track("agent-voice", audio_source)

    # Publish the track so user can hear agent
    options = rtc.TrackPublishOptions()
    options.source = rtc.TrackSource.SOURCE_MICROPHONE
    await ctx.room.local_participant.publish_track(audio_track, options)

    logger.info("✅ Audio output ready")

    # === STEP 4: Start Voice Conversation ===
    logger.info("🎙️ Starting voice conversation...")

    # Create conversation history
    messages = []
    messages.append({"role": "system", "content": system_prompt})

    # Get user's audio stream
    user = list(ctx.room.remote_participants.values())[0]
    logger.info(f"👤 Listening to: {user.identity}")

    # Process audio in a loop
    # Process audio in a loop
    async def process_conversation():
        """Listen to user, respond with AI"""
        
        # Wait a moment for tracks to be ready
        await asyncio.sleep(0.5)
        
        # Subscribe to user's audio track
        audio_track = None
        for track_pub in user.track_publications.values():
            if track_pub.kind == rtc.TrackKind.KIND_AUDIO:
                logger.info(f"🎤 Found audio track, subscribed: {track_pub.subscribed}")
                
                # If not subscribed, subscribe now
                if not track_pub.subscribed:
                    track_pub.set_subscribed(True)
                    await asyncio.sleep(0.5)  # Wait for subscription
                
                audio_track = track_pub.track
                break
        
        if not audio_track:
            logger.warning("⚠️ No audio track found!")
            return
        
        # Generate a greeting
        greeting = "Hello! I'm your AI assistant. How can I help you today?"
        logger.info(f"🤖 Agent saying: {greeting}")
        
        # Convert to speech and send
        try:
            # Synthesize speech
            async for audio_chunk in tts.synthesize(greeting):
                await audio_source.capture_frame(audio_chunk.frame) 
            logger.info("✅ Greeting sent!")
            
        except Exception as e:
            logger.error(f"❌ Error sending greeting: {e}")
            import traceback
            traceback.print_exc()
    
    # Run the conversation
    await process_conversation()

    # Keep agent alive
    logger.info("🔄 Conversation active, waiting for room to close...")
    try:
        while ctx.room.connection_state == rtc.ConnectionState.CONN_CONNECTED:
            await asyncio.sleep(1)
    except Exception:
        pass

    logger.info("👋 Room closed, agent shutting down")

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
