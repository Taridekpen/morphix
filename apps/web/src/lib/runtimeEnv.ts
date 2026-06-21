export function isDesktopApp(): boolean {
  return !!window.morphixDesktop?.isDesktop;
}

export function isLocalhost(): boolean {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export function isBrowserObsSupported(): boolean {
  return isLocalhost() && !isDesktopApp();
}
