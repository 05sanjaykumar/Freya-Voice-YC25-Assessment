import os
import logging
from dotenv import load_dotenv
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
)
from livekit.plugins import groq, silero

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")


async def entrypoint(ctx: JobContext):
    """
    Main entrypoint for the voice agent.
    """
    logger.info(f"🚀 Starting agent for room: {ctx.room.name}")
    
    # Get system prompt from room metadata
    system_prompt = ctx.room.metadata or "You are a helpful AI assistant."
    logger.info(f"📝 System prompt: {system_prompt[:50]}...")
    
    # Connect to the room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info("✅ Agent connected to room")
    
    # Initialize components
    try:
        # Voice Activity Detection
        vad = silero.VAD.load()
        logger.info("✅ VAD loaded")
        
        # Speech-to-Text
        stt = groq.STT()
        logger.info("✅ STT initialized")
        
        # Language Model
        llm_instance = groq.LLM(model="llama3-70b-8192")
        logger.info("✅ LLM initialized (llama3-70b-8192)")
        
        # Text-to-Speech
        tts = groq.TTS()
        logger.info("✅ TTS initialized")
        
        logger.info("🎙️ All voice components ready!")
        
    except Exception as e:
        logger.error(f"❌ Error initializing components: {e}")
        return
    
    # Wait for participant to join
    logger.info("⏳ Waiting for participant...")
    await ctx.wait_for_participant()
    logger.info("👤 Participant joined!")
    
    # Agent stays alive and connected
    # (We'll add actual conversation handling next)


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
