function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function browserApiUrl(path: string): string {
  return joinUrl(process.env.NEXT_PUBLIC_API_BASE_URL || "/api", path);
}

export function serverApiUrl(path: string): string {
  return joinUrl(
    process.env.INTERNAL_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:3001",
    path
  );
}
