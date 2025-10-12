"""Configuration for the voice agent"""
import os
from dotenv import load_dotenv

load_dotenv()

# LiveKit
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
CARTESIA_API_KEY = os.getenv("CARTESIA_API_KEY")

# Models
LLM_MODEL = "llama3-70b-8192"
DEFAULT_PROMPT = "You are a helpful AI assistant."

# Audio settings
AUDIO_SAMPLE_RATE = 24000
AUDIO_CHANNELS = 1
SILENCE_THRESHOLD = 30  # frames
