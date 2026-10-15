# 026 — audio-track — Changes

## 2026-10-15 — fix video audio multiplexing and asset loading
Why: Exported MP4 videos could lack audio because exportScene did not support WebM format flag or direct audioBuffer fetching when assets are loaded, and video-encoder did not check audio codec support via canEncodeAudio with fallback to PCM/Opus.
- MODIFIED D4@1 → D4@2
- Tasks: T009
