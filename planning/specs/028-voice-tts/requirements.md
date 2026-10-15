# 028 — voice-tts — Requirements

## What's being built

Voice generation via OpenRouter Text-to-Speech (TTS): synthesize spoken voiceovers from a
text script using OpenRouter's OpenAI-compatible speech endpoint, saving the resulting audio
asset directly into the scene and automatically generating synchronized subtitle cues.

## Who it serves

Creators who want to generate synthetic voiceovers and narration directly inside Lienzo
using their OpenRouter API key.

## Requirements

- R1@1: OpenRouter API key is read from environment variable `OPENROUTER_API_KEY` (or `.env.local`), with an optional override in editor settings.
- R2@1: The editor and service layer provide a voice generation interface where the user enters script text and selects a TTS model (e.g. ElevenLabs, OpenAI, Google Gemini Flash TTS via OpenRouter) and voice.
- R3@1: Generating speech sends a request to OpenRouter's speech endpoint (`/api/v1/audio/speech`), receives the audio stream, and saves it as an asset in `assets/`.
- R4@1: The generated audio is automatically set as the scene's audio track (`scene.audio`), and the scene duration can automatically adjust to fit the narration length.
- R5@1: Text script segments are converted into synchronized subtitle cues on a `subtitles` component (estimating timing per sentence/word or using voice alignment metadata if available).
- R6@1: A service tool (`scene_generate_speech`) allows generating voice and attaching it to scenes via CLI or MCP.

## Out of scope

- Voice cloning or training custom voice models.

## Dependencies

026, 027.

## Owner split

All tasks agent.
