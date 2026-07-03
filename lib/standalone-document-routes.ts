/** Routes that use standalone chrome — no portfolio loader, favicon, or nav. */
export function isStandaloneDocumentRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/sign") ||
    pathname.startsWith("/phonepe-proposal")
  );
}
