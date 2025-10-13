import os
import logging
from dotenv import load_dotenv
from livekit.agents import WorkerOptions, cli, JobContext
from voice_agent import voice_pipeline
from text_handler import text_pipeline

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main-agent")

async def entrypoint(ctx: JobContext):
    # Determine mode from frontend
    mode = getattr(ctx.room, "metadata", "voice")  # frontend should send "voice" or "text"
    logger.info(f"Starting session with mode: {mode}")

    if mode.lower() == "text":
        await text_pipeline(ctx)
    else:
        await voice_pipeline(ctx)

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
