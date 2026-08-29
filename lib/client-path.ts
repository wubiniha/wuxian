export function appPath(path: string) {
  const configuredBasePath = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_BASE_PATH ?? '' : '';
  const runtimeBasePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/video') ? '/video' : '';
  const basePath = configuredBasePath || runtimeBasePath;
  if (!basePath || path === basePath || path.startsWith(`${basePath}/`)) return path;
  return path.startsWith('/') ? `${basePath}${path}` : `${basePath}/${path}`;
}
