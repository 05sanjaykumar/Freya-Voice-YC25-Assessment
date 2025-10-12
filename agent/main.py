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
    logger.info("✅ TTS ready (Cartesia TTS ready!)")


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
    async def process_conversation():
        """Simpler conversation loop"""
        
        await asyncio.sleep(0.5)
        
        # Send greeting
        greeting = "Hello! I'm your AI assistant. How can I help you today?"
        logger.info(f"🤖 {greeting}")
        async for chunk in tts.synthesize(greeting):
            await audio_source.capture_frame(chunk.frame)
        logger.info("✅ Greeting sent, now listening...")
        
        # Use LiveKit's built-in conversation helper
        from livekit.agents import stt as stt_module
        
        stream = stt_module.StreamAdapter(
            stt=stt,
            vad=vad,
        )
        
        async for event in stream.stream():
            if event.type == stt_module.SpeechEventType.FINAL_TRANSCRIPT:
                user_text = event.alternatives[0].text
                logger.info(f"👤 User: {user_text}")
                
                # Generate response
                messages.append({"role": "user", "content": user_text})
                response = await llm_instance.chat(messages)
                ai_text = response.choices[0].message.content
                
                logger.info(f"🤖 Agent: {ai_text}")
                messages.append({"role": "assistant", "content": ai_text})
                
                # Speak it
                async for chunk in tts.synthesize(ai_text):
                    await audio_source.capture_frame(chunk.frame)

    
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
