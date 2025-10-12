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
from livekit.plugins import groq, silero

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
    tts = groq.TTS()
    logger.info("✅ TTS ready")

        # === STEP 2: Wait for User to Join ===
    logger.info("⏳ Waiting for user to join...")
    await ctx.wait_for_participant()
    logger.info("👤 User joined! Starting conversation...")

    # === STEP 3: Keep Agent Alive ===
    # For now, just keep the agent connected
    # We'll add actual voice processing in Step 3
    logger.info("🎙️ Agent ready to listen")

    # Keep the agent running (don't exit)
    # Wait forever until room closes
    try:
        while ctx.room.connection_state == rtc.ConnectionState.CONN_CONNECTED:
            await asyncio.sleep(1)  # Check every second
    except Exception:
        pass  # Room closed or error

    logger.info("👋 Room closed, agent shutting down")

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
