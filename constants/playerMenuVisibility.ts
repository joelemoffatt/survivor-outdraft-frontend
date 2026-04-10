const HIDE_PLAYER_MOBILE_MENU_PATTERNS = [
  '/(player)/groups/create2',
] as const;

const SHOW_PLAYER_MOBILE_MENU_PATTERNS: readonly string[] = [];

const normalizeRoutePath = (segments: readonly string[]) => `/${segments.join('/')}`;

const matchesPattern = (path: string, pattern: string) => {
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -1);
    return path.startsWith(prefix);
  }
  return path === pattern;
};

export const shouldShowPlayerMobileMenu = (segments: readonly string[]) => {
  const path = normalizeRoutePath(segments);

  if (SHOW_PLAYER_MOBILE_MENU_PATTERNS.some((pattern) => matchesPattern(path, pattern))) {
    return true;
  }

  if (HIDE_PLAYER_MOBILE_MENU_PATTERNS.some((pattern) => matchesPattern(path, pattern))) {
    return false;
  }

  return true;
};
