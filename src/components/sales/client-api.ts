export async function salesFetch<T>(
  url: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    const errors = result.errors
      ? Object.values(result.errors).flat().filter(Boolean).join(" ")
      : "";
    throw new Error(
      errors || result.message || "Unable to save. Please try again.",
    );
  }
  return result.data as T;
}
