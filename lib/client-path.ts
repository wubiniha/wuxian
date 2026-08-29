export function appPath(path: string) {
  const basePath = typeof window === 'undefined' || window.location.pathname.startsWith('/video') ? '/video' : '';
  if (!basePath || path === basePath || path.startsWith(`${basePath}/`)) return path;
  return path.startsWith('/') ? `${basePath}${path}` : `${basePath}/${path}`;
}
