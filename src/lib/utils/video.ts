export function getVideoEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be")
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    if (["youtube.com", "www.youtube.com"].includes(url.hostname)) {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (["vimeo.com", "www.vimeo.com"].includes(url.hostname)) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id)
        ? `https://player.vimeo.com/video/${id}`
        : "";
    }
    return "";
  } catch {
    return "";
  }
}
