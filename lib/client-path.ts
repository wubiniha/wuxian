export function appPath(path: string) {
  if (typeof window === 'undefined' || !window.location.pathname.startsWith('/video')) return path;
  return path.startsWith('/') ? `/video${path}` : `/video/${path}`;
}
