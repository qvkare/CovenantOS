export function loadDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  return url && url.length > 0 ? url : undefined;
}

export function isDatabaseEnabled(): boolean {
  return loadDatabaseUrl() !== undefined;
}
