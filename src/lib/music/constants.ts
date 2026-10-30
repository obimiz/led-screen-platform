export const musicContentTypes = [
  "song",
  "hymn",
  "chant",
  "worship",
  "praise",
  "instrumental",
  "prayer-audio",
  "sermon",
  "reflection",
  "choir-performance",
  "liturgical-audio",
  "other",
] as const;
export const musicPlatforms = [
  "youtube",
  "spotify",
  "apple-music",
  "audiomack",
  "soundcloud",
  "external",
  "owned",
  "other",
] as const;
export const musicStatuses = ["draft", "published", "archived"] as const;
export const musicRights = [
  "external-official",
  "client-owned",
  "licensed",
  "unknown",
] as const;
