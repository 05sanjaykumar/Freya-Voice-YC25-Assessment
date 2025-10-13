import logging
import json
from livekit.agents import JobContext
from livekit.plugins import groq
import asyncio

logger = logging.getLogger("text-agent")

async def text_pipeline(ctx: JobContext):
    """Text-to-text pipeline"""
    logger.info(f"🚀 Text agent started for room: {ctx.room.name}")

    system_prompt = ctx.room.metadata or "You are a helpful AI assistant."
    messages = [{"role": "system", "content": system_prompt}]

    await ctx.connect()

    async def handle_messages():
        while ctx.room.connection_state.name == "CONN_CONNECTED":
            data_event = await ctx.room.wait_for_data()
            try:
                payload = data_event.payload
                data = json.loads(payload.decode())
                if data.get("type") == "text_message":
                    user_text = data["content"]
                    messages.append({"role": "user", "content": user_text})
                    llm_instance = groq.LLM(model="llama3-70b-8192")
                    response = await llm_instance.chat(messages)
                    ai_text = response.choices[0].message.content
                    messages.append({"role": "assistant", "content": ai_text})
                    await ctx.room.local_participant.publish_data(ai_text.encode(), reliable=True)
            except Exception as e:
                logger.error(f"Error processing message: {e}")
            await asyncio.sleep(0.1)

    await handle_messages()
