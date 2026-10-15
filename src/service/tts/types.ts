/**
 * Domain types and interface for Text-To-Speech services (D2, R2).
 * Follows Principle 3 (Service Layer + Anti-Corruption / Dependency Inversion).
 */

export interface TtsVoice {
  id: string;
  name: string;
  language?: string;
  gender?: "male" | "female" | "neutral";
}

export interface TtsModel {
  id: string;
  name: string;
  provider: string;
  voices: TtsVoice[];
}

export interface SynthesizeSpeechRequest {
  text: string;
  voice: string;
  model?: string;
  speed?: number;
  format?: "mp3" | "wav" | "aac" | "opus";
  apiKey?: string;
}

export interface SynthesizeSpeechResult {
  audioBuffer: Uint8Array;
  mimeType: string;
  format: string;
  /** Estimated or calculated audio duration in seconds. */
  durationSeconds?: number;
}

export interface TtsService {
  /**
   * Synthesizes audio from text using the configured provider.
   */
  synthesizeSpeech(
    request: SynthesizeSpeechRequest,
  ): Promise<SynthesizeSpeechResult>;

  /**
   * Available TTS models and standard voices.
   */
  listModels(): Promise<TtsModel[]>;
}

/** Standard models and voices offered in Lienzo */
export const POPULAR_TTS_MODELS: TtsModel[] = [
  {
    id: "openai/tts-1",
    name: "OpenAI TTS 1",
    provider: "OpenAI",
    voices: [
      { id: "alloy", name: "Alloy", gender: "neutral" },
      { id: "echo", name: "Echo", gender: "male" },
      { id: "fable", name: "Fable", gender: "male" },
      { id: "onyx", name: "Onyx", gender: "male" },
      { id: "nova", name: "Nova", gender: "female" },
      { id: "shimmer", name: "Shimmer", gender: "female" },
    ],
  },
  {
    id: "openai/tts-1-hd",
    name: "OpenAI TTS 1 HD",
    provider: "OpenAI",
    voices: [
      { id: "alloy", name: "Alloy", gender: "neutral" },
      { id: "echo", name: "Echo", gender: "male" },
      { id: "fable", name: "Fable", gender: "male" },
      { id: "onyx", name: "Onyx", gender: "male" },
      { id: "nova", name: "Nova", gender: "female" },
      { id: "shimmer", name: "Shimmer", gender: "female" },
    ],
  },
  {
    id: "elevenlabs/eleven_multilingual_v2",
    name: "ElevenLabs Multilingual v2",
    provider: "ElevenLabs",
    voices: [
      { id: "rachel", name: "Rachel", gender: "female" },
      { id: "drew", name: "Drew", gender: "male" },
      { id: "clyde", name: "Clyde", gender: "male" },
      { id: "paul", name: "Paul", gender: "male" },
      { id: "domi", name: "Domi", gender: "female" },
      { id: "dave", name: "Dave", gender: "male" },
      { id: "fin", name: "Fin", gender: "male" },
      { id: "sarah", name: "Sarah", gender: "female" },
      { id: "antoni", name: "Antoni", gender: "male" },
      { id: "thomas", name: "Thomas", gender: "male" },
      { id: "charlie", name: "Charlie", gender: "male" },
      { id: "george", name: "George", gender: "male" },
      { id: "emily", name: "Emily", gender: "female" },
      { id: "elli", name: "Elli", gender: "female" },
      { id: "callum", name: "Callum", gender: "male" },
      { id: "patrick", name: "Patrick", gender: "male" },
      { id: "harry", name: "Harry", gender: "male" },
      { id: "liam", name: "Liam", gender: "male" },
      { id: "dorothy", name: "Dorothy", gender: "female" },
      { id: "josh", name: "Josh", gender: "male" },
      { id: "arnold", name: "Arnold", gender: "male" },
      { id: "charlotte", name: "Charlotte", gender: "female" },
      { id: "alice", name: "Alice", gender: "female" },
      { id: "matilda", name: "Matilda", gender: "female" },
      { id: "james", name: "James", gender: "male" },
      { id: "joseph", name: "Joseph", gender: "male" },
      { id: "jeremy", name: "Jeremy", gender: "male" },
      { id: "michael", name: "Michael", gender: "male" },
      { id: "ethan", name: "Ethan", gender: "male" },
      { id: "giggle", name: "Giggle", gender: "female" },
      { id: "glinda", name: "Glinda", gender: "female" },
      { id: "giovanni", name: "Giovanni", gender: "male" },
      { id: "mimi", name: "Mimi", gender: "female" },
    ],
  },
];
