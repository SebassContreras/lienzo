const ascii = (b: Uint8Array, i: number) =>
  String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);

export interface WavSamples {
  samples: Int16Array;
  sampleRate: number;
}

/**
 * Extracts 16-bit PCM samples and sample rate from a RIFF/WAVE audio buffer (D1).
 * Returns undefined if buffer is not a 16-bit PCM WAV.
 */
export function readWavSamples(b: Uint8Array): WavSamples | undefined {
  if (b.length < 44 || ascii(b, 0) !== "RIFF" || ascii(b, 8) !== "WAVE") {
    return undefined;
  }

  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let sampleRate: number | undefined;
  let audioFormat: number | undefined;
  let bitsPerSample: number | undefined;
  let dataOffset: number | undefined;
  let dataSize: number | undefined;

  let i = 12;
  while (i + 8 <= b.length) {
    const id = ascii(b, i);
    const size = view.getUint32(i + 4, true);

    if (id === "fmt " && i + 24 <= b.length) {
      audioFormat = view.getUint16(i + 8, true);
      sampleRate = view.getUint32(i + 12, true);
      bitsPerSample = view.getUint16(i + 22, true);
    } else if (id === "data") {
      dataOffset = i + 8;
      dataSize = Math.min(size, b.length - dataOffset);
      break;
    }

    i += 8 + size + (size % 2);
  }

  // AudioFormat 1 = PCM, must be 16-bit
  if (
    audioFormat !== 1 ||
    bitsPerSample !== 16 ||
    !sampleRate ||
    dataOffset === undefined ||
    dataSize === undefined ||
    dataSize < 2
  ) {
    return undefined;
  }

  const numSamples = Math.floor(dataSize / 2);
  const samples = new Int16Array(numSamples);

  for (let s = 0; s < numSamples; s++) {
    samples[s] = view.getInt16(dataOffset + s * 2, true);
  }

  return {
    samples,
    sampleRate,
  };
}
