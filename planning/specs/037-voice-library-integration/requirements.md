# 037 — voice-library-integration — Requirements

## What's being built

Seamless integration of Text-to-Speech (TTS) voice generation into the basic elements toolbar and the preset library. A primary "Voz con IA" button is placed alongside standard canvas elements (shapes, text, icons), opening the voice creation dialog directly. Generated voices and reusable voice voiceover configurations can be saved into a dedicated "Voces" category in the preset library. Generated audio binary files are saved exclusively in local unversioned assets (`assets/`, ignored by Git).

## Who it serves

Content creators who want quick, direct access to synthetic voiceover generation from the main canvas element bar, and want to reuse voice profiles and scripts across projects.

## Requirements

- R1@1: The basic elements library / toolbar in the left panel displays a prominent "Voz con IA" (AI Voice) button alongside Rectángulo, Texto, and Ícono.
- R2@1: Clicking "Voz con IA" opens the voice generation panel or modal, pre-populated with provider/voice selection and script input.
- R3@1: Once synthesized, the resulting audio file is saved strictly as an asset in `assets/` (which is excluded from Git version control via `.gitignore`) and attached to the scene's audio tracks.
- R4@1: The preset library (`presets/`) features a dedicated "Voces" (Voices) category where users can browse, save, and apply voice presets (recipe containing provider, model, voice ID, and speech settings).
- R5@1: Applying a voice preset from the library configures the TTS engine or attaches the voice profile without committing binary audio data into the Git repository.

## Out of scope

- Direct microphone voice recording in browser.
- Git LFS storage for audio assets.

## Dependencies

028, 003, 004, 035.

## Owner split

All tasks agent.
