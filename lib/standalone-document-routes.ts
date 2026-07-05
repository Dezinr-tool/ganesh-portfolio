/** Routes that use standalone chrome — no portfolio loader, favicon, or nav. */
export function isStandaloneDocumentRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/sign") ||
    isToolWorkspaceRoute(pathname)
  );
}

/** Tool workspaces hide portfolio SiteNav and ConnectButton. */
export function isToolWorkspaceRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/moodboard") ||
    pathname.startsWith("/tools") ||
    pathname.startsWith("/ia") ||
    pathname.startsWith("/design-audit") ||
    pathname.startsWith("/wireframe")
  );
}
