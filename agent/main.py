# agent/main.py
import logging
from livekit.agents import JobContext, WorkerOptions, cli
from agent.voice_agent import VoiceAgent

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")


async def entrypoint(ctx: JobContext):
    """Main entrypoint for the voice agent"""
    agent = VoiceAgent(ctx)
    await agent.start()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
