import { expect, it } from "vitest";
import { looksLikeAudio } from "./asset-helpers.ts";

const bytes = (s: string) => new TextEncoder().encode(s);

it("accepts an mp3 that starts with an ID3 tag", () => {
  expect(looksLikeAudio(bytes("ID3\u0004rest"), "mp3")).toBe(true);
});

it("accepts a wav with a RIFF/WAVE header", () => {
  expect(looksLikeAudio(bytes("RIFF1234WAVEfmt "), "wav")).toBe(true);
});

it("refuses text named .mp3", () => {
  expect(looksLikeAudio(bytes("not audio at all"), "mp3")).toBe(false);
});

it("refuses a wav header on an ogg file", () => {
  expect(looksLikeAudio(bytes("RIFF1234WAVEfmt "), "ogg")).toBe(false);
});
