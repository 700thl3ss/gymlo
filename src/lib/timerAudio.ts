// Generates an in-memory WAV audio track with silence for the rest period
// ending with a distinct, audible 3-tone chime alert.
// When played on iOS/Safari, this keeps native media playback alive while the device is locked,
// ensures the chime plays out loud through speakers/headphones, and triggers completion on finish.

export function createTimerAudioBlob(totalSeconds: number): Blob {
  const sampleRate = 8000; // 8kHz mono is very lightweight (< 1MB for 2 minutes)
  const numSamples = Math.max(sampleRate * 2, Math.floor(totalSeconds * sampleRate));
  const dataSize = numSamples;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF Chunk Descriptor
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");

  // "fmt " sub-chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 1, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 8, true); // BitsPerSample (8 bits)

  // "data" sub-chunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const bytes = new Uint8Array(buffer, 44, dataSize);
  // Fill entire duration with silence (128 is center/silence for 8-bit unsigned PCM)
  bytes.fill(128);

  // In the final 1.25 seconds, synthesize a pleasant 3-tone rising chime (E5 -> G#5 -> B5)
  // Each tone lasts ~0.28s with ~0.08s envelope decay
  const chimeStart = Math.max(0, numSamples - Math.floor(1.25 * sampleRate));
  const tones = [
    { startSec: 0.0, dur: 0.28, freq: 659.25 }, // E5
    { startSec: 0.36, dur: 0.28, freq: 830.61 }, // G#5
    { startSec: 0.72, dur: 0.50, freq: 987.77 }, // B5
  ];

  for (const t of tones) {
    const startIdx = chimeStart + Math.floor(t.startSec * sampleRate);
    const endIdx = Math.min(numSamples, startIdx + Math.floor(t.dur * sampleRate));
    const toneLen = endIdx - startIdx;
    if (toneLen <= 0) continue;

    for (let i = startIdx; i < endIdx; i++) {
      const elapsed = (i - startIdx) / sampleRate;
      const sinVal = Math.sin(2 * Math.PI * t.freq * elapsed);
      // Smooth attack and decay envelope to prevent audio clicking
      const progress = (i - startIdx) / toneLen;
      const env = Math.sin(Math.PI * progress);
      // Amplitude: 110 (out of 127) for clear volume
      bytes[i] = Math.floor(128 + 110 * sinVal * env);
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function playStandaloneChime() {
  if (typeof window === "undefined") return;

  try {
    const blob = createTimerAudioBlob(1.5);
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().catch(() => {});
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (e) {
    console.warn("Failed to play standalone chime:", e);
  }
}
