export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (
    raw && typeof raw === "string" ? raw : "https://34.126.165.66/finder-doctor"
  ).replace(/\/+$/, "");
}

export function getApiUsername(): string {
  const raw = import.meta.env.VITE_API_USERNAME as string | undefined;
  return (raw && typeof raw === "string" ? raw : "sylein").trim();
}

export function getApiPassword(): string {
  const raw = import.meta.env.VITE_API_PASSWORD as string | undefined;
  return (raw && typeof raw === "string" ? raw : "123456").trim();
}
