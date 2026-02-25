/**
 * Text formatting utilities for Survivor episode data
 * Transforms raw API data into human-readable text
 */

/**
 * Check if a value contains meaningful text (not empty, unknown, none, or n/a)
 */
export function isMeaningfulText(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== '' && normalized !== 'unknown' && normalized !== 'none' && normalized !== 'n/a';
}

/**
 * Join non-empty parts with bullet separator
 */
export function joinParts(parts: Array<string | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part && part.trim().length > 0)).join(' • ');
}

/**
 * Capitalize only the first letter and lowercase the rest
 * Example: "Block a Vote" → "block a vote", "voted out" → "voted out"
 */
export function capitalizeFirstLetterOnly(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Convert text to sentence case (first letter uppercase)
 */
export function sentenceCase(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Format a castaway name with descriptive fragments as a sentence
 * Example: "Jeff" + ["won", "got reward"] => "Jeff - Won got reward"
 */
export function sentenceForCastaway(name: string, fragments: Array<string | null | undefined>): string {
  const parts = fragments.filter((part): part is string => Boolean(part && part.trim().length > 0));
  if (parts.length === 0) return name;
  const sentence = parts.join(' ').trim();
  const normalized = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  return `${name} - ${normalized}`;
}

/**
 * Convert camelCase or snake_case event names to human-readable format
 * Example: "foundHiddenImmunity" => "found hidden immunity"
 */
export function humanizeEvent(value: string | null | undefined): string {
  if (!value) return '';
  // First convert camelCase to spaces
  const withSpaces = value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').trim();
  if (!withSpaces) return '';
  // Return lowercase version
  return withSpaces.toLowerCase();
}

/**
 * Convert success boolean or string to human-readable result text (lowercase)
 * Example: "yes" => "and it was successful"
 */
export function humanizeSuccess(value: string | null | undefined): string {
  if (!value) return '';
  const normalized = value.trim().toLowerCase();
  if (!normalized) return '';
  if (normalized === 'yes' || normalized === 'true') return 'with result it was successful';
  if (normalized === 'no' || normalized === 'false') return 'with result it was not successful';
  return `with result ${normalized}`;
}

/**
 * Format advantage event action text
 * Handles special cases like "beware" advantages
 */
export function advantageActionText(event: string | null | undefined, advantageType: string | null | undefined): string {
  const rawEvent = event?.trim().toLowerCase() || '';
  const formattedType = advantageType ? advantageType.toLowerCase() : '';
  if (rawEvent.includes('beware')) {
    return isMeaningfulText(advantageType)
      ? `Found beware advantage for ${formattedType}`
      : 'Found beware advantage';
  }
  if (rawEvent === 'found') {
    return isMeaningfulText(advantageType)
      ? `Found a ${formattedType}`
      : 'Found an advantage';
  }
  if (rawEvent === 'received') {
    return isMeaningfulText(advantageType)
      ? `Received a ${formattedType}`
      : 'Received an advantage';
  }
  if (rawEvent === 'expired') {
    return isMeaningfulText(advantageType)
      ? `Expired a ${formattedType}`
      : 'Expired an advantage';
  }
  if (rawEvent === 'activated') {
    return isMeaningfulText(advantageType)
      ? `Activated a ${formattedType}`
      : 'Activated an advantage';
  }
  if (rawEvent === 'absorbed') {
    return isMeaningfulText(advantageType)
      ? `Absorbed a ${formattedType}`
      : 'Absorbed an advantage';
  }
  if (rawEvent === 'banked') {
    return isMeaningfulText(advantageType)
      ? `Banked a ${formattedType}`
      : 'Banked an advantage';
  }
  if (rawEvent === 'became') {
    return isMeaningfulText(advantageType)
      ? `Became ${formattedType}`
      : 'Became an advantage';
  }
  if (rawEvent === 'left game with advantage') {
    return isMeaningfulText(advantageType)
      ? `Left game with advantage a ${formattedType}`
      : 'Left game with advantage';
  }
  if (rawEvent === 'recieved' || rawEvent === 'received') {
    return isMeaningfulText(advantageType)
      ? `Received a ${formattedType}`
      : 'Received an advantage';
  }
  if (rawEvent === 'found (beware)') {
    return isMeaningfulText(advantageType)
      ? `Found (beware) ${formattedType}`
      : 'Found (beware) advantage';
  }
  if (rawEvent === 'played') {
    return isMeaningfulText(advantageType)
      ? `Played ${formattedType}`
      : 'Played an advantage';
  }
  if (rawEvent === 'expired') {
    return isMeaningfulText(advantageType)
      ? `Expired a ${formattedType}`
      : 'Expired an advantage';
  }
  if (rawEvent === 'voted out with advantage') {
    return isMeaningfulText(advantageType)
      ? `Voted out with advantage a ${formattedType}`
      : 'Voted out with advantage';
  }
  if (rawEvent === 'became') {
    return isMeaningfulText(advantageType)
      ? `Became ${formattedType}`
      : 'Became an advantage';
  }
  if (rawEvent === 'activated') {
    return isMeaningfulText(advantageType)
      ? `Activated a ${formattedType}`
      : 'Activated an advantage';
  }
  if (rawEvent === 'absorbed') {
    return isMeaningfulText(advantageType)
      ? `Absorbed a ${formattedType}`
      : 'Absorbed an advantage';
  }
  if (rawEvent === 'banked') {
    return isMeaningfulText(advantageType)
      ? `Banked a ${formattedType}`
      : 'Banked an advantage';
  }
  if (rawEvent === 'recieved') {
    return isMeaningfulText(advantageType)
      ? `Recieved a ${formattedType}`
      : 'Recieved an advantage';
  }
  // fallback
  return isMeaningfulText(event)
    ? `${capitalizeFirstLetterOnly(event)}${isMeaningfulText(advantageType) ? ` a ${formattedType}` : ''}`
    : 'Had an advantage event';
}

/**
 * Check if a challenge is tribal/team-based
 */
export function isTribalChallenge(challengeType: string | null | undefined): boolean {
  return Boolean(challengeType && challengeType.toLowerCase().includes('tribal'));
}

/**
 * Format advantage movement description in a friendly, readable way
 * Examples:
 * - "Alex played hidden immunity idol for himself and nullified 1 vote (not needed)"
 * - "MC found beware advantage for hidden immunity idol"
 */
export function formatAdvantageMovement(
  castawayName: string,
  event: string | null | undefined,
  advantageType: string | null | undefined,
  playedForName: string | null | undefined,
  success: string | null | undefined,
  votesNullified: number | null | undefined
): string {
  let action = advantageActionText(event, advantageType);

  // Handle "played" event specially - add "for" clause and votes nullified/result
  if (event?.toLowerCase() === 'played') {
    const forClause = isMeaningfulText(playedForName)
      ? (playedForName ?? '').toLowerCase() === castawayName.toLowerCase()
        ? 'for themselves'
        : `for ${playedForName}`
      : '';
    const formattedType = advantageType ? advantageType.toLowerCase() : 'advantage';
    action = `Played ${formattedType}${forClause ? ` ${forClause}` : ''}`;
    if (votesNullified && votesNullified > 0) {
      action += ` and nullified ${votesNullified} vote${votesNullified !== 1 ? 's' : ''}`;
    }
    if (isMeaningfulText(success)) {
      const resultText = (success ?? '').toLowerCase() === 'not needed' ? 'not needed' : capitalizeFirstLetterOnly(success);
      action += ` (${resultText})`;
    }
  }
  return action;
}

/**
 * Map special boot event names to human-readable descriptions
 */
const bootEventMap: Record<string, string> = {
  'votedOut': 'voted out',
  'medevac': 'medically evacuated',
  'medEvac': 'medically evacuated',
  'quit': 'quit',
  'second': 'finished second',
  'first': 'finished first',
  'third': 'finished third',
  'lostFire': 'lost fire tiebreaker',
  'lostFinalFire': 'lost final fire tiebreaker',
  'ejected': 'ejected',
  'eliminated': 'eliminated',
  'switched': 'switched tribes',
};

/**
 * Format boot event to human-readable text
 */
export function formatBootEvent(event: string | null | undefined): string {
  if (!event) return 'left the game';
  const mapped = bootEventMap[event];
  if (mapped) return mapped;
  // For boot order events, keep the original event string (e.g., 'voted out boot order 4')
  if (/boot order \d+/.test(event)) return event;
  return capitalizeFirstLetterOnly(event);
}

/**
 * Format placement number to human-readable text
 * 1st place = "Won"
 * Last place = "Lost"
 * Middle places = "2nd", "3rd", "4th", etc.
 */
export function formatPlacement(place: number, totalPlaces: number): string {
  if (place === 1) {
    return 'Won';
  }
  if (place === totalPlaces && totalPlaces > 1) {
    return 'Lost';
  }
  
  // Format ordinal numbers (2nd, 3rd, 4th, etc.)
  const suffix = getOrdinalSuffix(place);
  return `${place}${suffix}`;
}

/**
 * Get ordinal suffix for a number (st, nd, rd, th)
 */
function getOrdinalSuffix(num: number): string {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return 'th';
  }
  
  switch (lastDigit) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
