export const DEFAULT_AUDIO_MAX_BYTES = 50 * 1024 * 1024;
export const audioMimeTypes = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
] as const;
export function audioSizeLimit(value = process.env.MUSIC_AUDIO_MAX_BYTES) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 1024 && n <= 250 * 1024 * 1024
    ? n
    : DEFAULT_AUDIO_MAX_BYTES;
}
export function canonicalAudioType(value: string) {
  if (["audio/mpeg", "audio/mp3"].includes(value)) return "audio/mpeg";
  if (["audio/mp4", "audio/x-m4a", "audio/m4a"].includes(value))
    return "audio/mp4";
  if (["audio/wav", "audio/x-wav", "audio/wave"].includes(value))
    return "audio/wav";
  return null;
}
export class AudioValidationError extends Error {}
const invalid = () =>
  new AudioValidationError(
    "Upload a valid MP3, M4A (audio-only MP4), or PCM WAV recording.",
  );
function hasAudioHandler(
  box: Buffer,
  depth = 0,
): { audio: boolean; video: boolean } {
  if (depth > 8) throw invalid();
  let offset = 0,
    audio = false,
    video = false;
  while (offset + 8 <= box.length) {
    const size = box.readUInt32BE(offset);
    if (size < 8 || offset + size > box.length) throw invalid();
    const kind = box.toString("ascii", offset + 4, offset + 8);
    const payload = box.subarray(offset + 8, offset + size);
    if (kind === "hdlr" && payload.length >= 12) {
      audio ||= payload.toString("ascii", 8, 12) === "soun";
      video ||= payload.toString("ascii", 8, 12) === "vide";
    }
    if (["trak", "mdia"].includes(kind)) {
      const h = hasAudioHandler(payload, depth + 1);
      audio ||= h.audio;
      video ||= h.video;
    }
    offset += size;
  }
  if (offset !== box.length) throw invalid();
  return { audio, video };
}
/** Validates bounded prefixes and MP4 box structure while large payloads flow past. */
export class AudioValidator {
  private prefix = Buffer.alloc(0);
  private bytes = 0;
  private header = Buffer.alloc(0);
  private remaining = 0;
  private kind = "";
  private parts: Buffer[] = [];
  private mp4 = false;
  private initialized = false;
  private sawMedia = false;
  private sawAudio = false;
  private sawFtyp = false;
  constructor(private mime: string) {}
  push(chunk: Buffer) {
    this.bytes += chunk.length;
    if (this.prefix.length < 256 * 1024)
      this.prefix = Buffer.concat([
        this.prefix,
        chunk.subarray(0, 256 * 1024 - this.prefix.length),
      ]);
    if (!this.initialized && this.prefix.length >= 12) {
      this.initialized = true;
      this.mp4 = this.mime === "audio/mp4";
    }
    if (this.mime === "audio/mp4") this.mp4Chunk(chunk);
  }
  private mp4Chunk(chunk: Buffer) {
    let offset = 0;
    while (offset < chunk.length) {
      if (this.remaining === 0) {
        const needed =
          this.header.length >= 8 && this.header.readUInt32BE(0) === 1 ? 16 : 8;
        const take = Math.min(
          needed - this.header.length,
          chunk.length - offset,
        );
        this.header = Buffer.concat([
          this.header,
          chunk.subarray(offset, offset + take),
        ]);
        offset += take;
        if (this.header.length < needed) continue;
        if (needed === 8 && this.header.readUInt32BE(0) === 1) continue;
        const size =
          needed === 16
            ? Number(this.header.readBigUInt64BE(8))
            : this.header.readUInt32BE(0);
        if (!Number.isSafeInteger(size) || size < needed) throw invalid();
        this.kind = this.header.toString("ascii", 4, 8);
        this.remaining = size - needed;
        this.header = Buffer.alloc(0);
        this.parts = [];
        if (this.kind === "moov" && this.remaining > 2 * 1024 * 1024)
          throw new AudioValidationError(
            "M4A metadata exceeds the supported 2 MB limit.",
          );
        if (this.kind === "ftyp" && this.remaining > 1024) throw invalid();
        if (this.kind === "mdat" && this.remaining > 0) this.sawMedia = true;
        if (!this.remaining) this.finishBox();
      } else {
        const take = Math.min(this.remaining, chunk.length - offset);
        if (["ftyp", "moov"].includes(this.kind))
          this.parts.push(chunk.subarray(offset, offset + take));
        offset += take;
        this.remaining -= take;
        if (!this.remaining) this.finishBox();
      }
    }
  }
  private finishBox() {
    if (this.kind === "ftyp") {
      const data = Buffer.concat(this.parts);
      if (data.length < 8) throw invalid();
      const brands = [];
      for (let i = 0; i + 4 <= data.length; i += 4)
        brands.push(data.toString("ascii", i, i + 4));
      if (
        !brands.some((b) =>
          ["M4A ", "M4B ", "isom", "mp42", "iso2"].includes(b),
        )
      )
        throw invalid();
      this.sawFtyp = true;
    }
    if (this.kind === "moov") {
      const h = hasAudioHandler(Buffer.concat(this.parts));
      if (h.video)
        throw new AudioValidationError(
          "Video files are not supported; upload an audio-only M4A.",
        );
      this.sawAudio ||= h.audio;
    }
    this.parts = [];
  }
  finish() {
    if (!this.bytes) throw invalid();
    const p = this.prefix;
    if (this.mime === "audio/mp4") {
      if (
        !this.mp4 ||
        this.header.length ||
        this.remaining ||
        !this.sawMedia ||
        !this.sawAudio ||
        !this.sawFtyp
      )
        throw invalid();
      return;
    }
    if (this.mime === "audio/wav") {
      if (
        p.length < 44 ||
        p.toString("ascii", 0, 4) !== "RIFF" ||
        p.toString("ascii", 8, 12) !== "WAVE" ||
        p.readUInt32LE(4) + 8 !== this.bytes
      )
        throw invalid();
      let offset = 12,
        format = false,
        data = false;
      while (offset + 8 <= p.length) {
        const kind = p.toString("ascii", offset, offset + 4),
          size = p.readUInt32LE(offset + 4);
        if (offset + 8 + size > this.bytes) throw invalid();
        if (kind === "fmt ") {
          if (
            size < 16 ||
            offset + 24 > p.length ||
            ![1, 3].includes(p.readUInt16LE(offset + 8)) ||
            !p.readUInt16LE(offset + 10) ||
            !p.readUInt32LE(offset + 12)
          )
            throw invalid();
          format = true;
        }
        if (kind === "data") {
          data = size > 0;
          break;
        }
        offset += 8 + size + (size % 2);
      }
      if (!format || !data) throw invalid();
      return;
    }
    if (this.mime === "audio/mpeg") {
      let offset = 0;
      if (p.toString("ascii", 0, 3) === "ID3") {
        if (
          p.length < 10 ||
          ![2, 3, 4].includes(p[3]) ||
          [6, 7, 8, 9].some((i) => p[i] > 127)
        )
          throw invalid();
        offset = 10 + ((p[6] << 21) | (p[7] << 14) | (p[8] << 7) | p[9]);
        if (offset + 4 > p.length)
          throw new AudioValidationError(
            "MP3 tags exceed the supported 256 KB probe; remove large embedded artwork before uploading.",
          );
      }
      const h = p.subarray(offset, offset + 4);
      if (
        h.length !== 4 ||
        h[0] !== 255 ||
        (h[1] & 224) !== 224 ||
        ((h[1] >> 3) & 3) === 1 ||
        ((h[1] >> 1) & 3) !== 1 ||
        !(h[2] >> 4) ||
        h[2] >> 4 === 15 ||
        ((h[2] >> 2) & 3) === 3
      )
        throw invalid();
      const version = (h[1] >> 3) & 3,
        rateIndex = (h[2] >> 2) & 3,
        bitIndex = (h[2] >> 4) - 1;
      const bitrate = (
        version === 3
          ? [32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
          : [8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
      )[bitIndex];
      const rate =
        [44100, 48000, 32000][rateIndex] /
        (version === 3 ? 1 : version === 2 ? 2 : 4);
      const frameSize =
        Math.floor(((version === 3 ? 144000 : 72000) * bitrate) / rate) +
        ((h[2] >> 1) & 1);
      if (this.bytes < offset + frameSize) throw invalid();
      return;
    }
    throw invalid();
  }
}
export function parseAudioRange(
  value: string | null,
  length: number,
): { start: number; end: number } | null {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2]))
    throw new AudioValidationError("Invalid byte range");
  let start: number, end: number;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) throw invalid();
    start = Math.max(0, length - suffix);
    end = length - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), length - 1) : length - 1;
  }
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start >= length ||
    end < start
  )
    throw new AudioValidationError("Invalid byte range");
  return { start, end };
}
