import os
from dotenv import load_dotenv
from livekit.agents import AgentSession, Agent, WorkerOptions, cli, JobContext
from livekit.plugins import groq

load_dotenv()

async def entrypoint(ctx: JobContext):
    await ctx.connect()
    
    # Get prompt from room metadata
    prompt_body = ctx.room.metadata or "You are a helpful AI assistant."
    
    session = AgentSession(
        stt=groq.STT(model="whisper-large-v3-turbo"),
        llm=groq.LLM(model="llama-3.3-70b-versatile"),
        tts=groq.TTS(model="playai-tts")
    )
    
    await session.start(
        room=ctx.room,
        agent=Agent(instructions=prompt_body)
    )
    
    await session.generate_reply(
        instructions="Greet the user warmly."
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
