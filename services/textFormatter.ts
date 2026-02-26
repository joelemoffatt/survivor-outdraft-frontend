/**
 * Returns 'a' or 'an' based on the first letter of the word
 */
export function getIndefiniteArticle(word: string): string {
  if (!word) return "a";
  const firstChar = word.trim().charAt(0).toLowerCase();
  return ["a", "e", "i", "o", "u"].includes(firstChar) ? "an" : "a";
}
/**
 * Convert a string to lower case, safely handling null/undefined
 */
export function toLowerSafe(value: string | null | undefined): string {
  return value ? value.toLowerCase() : "";
}
// Section helpers for episode event text
export function getJourneySentence(journey: any): string {
  // Custom handling for risked vote journeys
  const event = journey.event ? journey.event.toLowerCase() : "";
  const reward = journey.reward ? journey.reward.toLowerCase() : "";
  if (event === "risked vote") {
    if (journey.lostVote) {
      return "Risked vote and lost it";
    }
    if (reward && reward !== "none" && reward !== "n/a") {
      return `Risked vote and won ${journey.reward.toLowerCase()}`;
    }
    return "Risked vote and kept vote";
  }
  if (event === "did not risk vote") {
    return "Did not risk vote";
  }

  // If reward is exactly 'lost vote' (or only whitespace), just return 'Lost vote'
  const rewardText = (journey.reward ?? "").trim().toLowerCase();
  if (rewardText === "lost vote") {
    return "Lost vote";
  }

  // If reward contains both a reward and 'lost vote', output 'got reward <reward> but lost vote'
  if (rewardText.includes("lost vote")) {
    // Remove 'lost vote' from reward, trim, and check if anything remains
    const rewardParts = rewardText.split(";").map((s: string) => s.trim());
    const filteredRewards = rewardParts.filter(
      (s: string) => s && s !== "lost vote",
    );
    if (filteredRewards.length > 0) {
      return `Got reward ${filteredRewards.join("; ")} but lost vote`;
    } else {
      return "Lost vote";
    }
  }

  // Default logic
  return sentenceForCastaway(journey.castawayName, [
    isMeaningfulText(journey.reward ?? undefined)
      ? `got reward ${journey.reward.toLowerCase()}`
      : "got no reward",
    journey.choseToPlay ? "and chose to play" : null,
  ]);
}

export function getChallengeSentence(
  challenge: any,
  group: any,
  totalTribes: number,
) {
  return sentenceForCastaway(group.tribeName, [
    group.performances[0]?.place != null
      ? formatPlacement(group.performances[0].place, totalTribes)
      : "competed",
  ]);
}

export function getChallengePerformanceSentence(
  performance: any,
  totalCompetitors: number,
) {
  return sentenceForCastaway(performance.castawayName, [
    performance.place != null
      ? formatPlacement(performance.place, totalCompetitors)
      : null,
    performance.satOut ? "sat out" : null,
  ]);
}

export function getAdvantageMovementSentence(movement: any) {
  return (
    sentenceCase(movement.castawayName) +
    " - " +
    formatAdvantageMovement(
      movement.castawayName,
      movement.event,
      movement.advantageType,
      movement.playedForName,
      movement.success,
      movement.votesNullified,
    )
  );
}

export function getTribalSentence(tribal: any) {
  return isMeaningfulText(tribal.votedOutName)
    ? `${tribal.votedOutName} was voted out${tribal.bootOrder != null ? ` at boot order ${tribal.bootOrder}` : ""}`
    : "No voted out data available.";
}

export function getTribalVoteSentence(vote: any) {
  return sentenceForCastaway(vote.voterName, [
    `voted for ${vote.votedForName}`,
    vote.nullified ? "vote was nullified" : null,
  ]);
}

export function getBootSentence(boot: any) {
  return sentenceForCastaway(boot.castawayName, [
    isMeaningfulText(boot.event ?? undefined)
      ? formatBootEvent(boot.event)
      : "left the game",
    isMeaningfulText(boot.tribeName ?? undefined)
      ? `from ${boot.tribeName}`
      : null,
    boot.bootOrder != null ? `boot order ${boot.bootOrder}` : null,
  ]);
}

export function getFinalResultBootSentence(boot: any) {
  // Simple handling for finalists and fire making
  const event = (boot.event ?? "").toLowerCase();
  if (event.includes("fire")) {
    return `${boot.castawayName} - Lost in fire making competition`;
  }
  if (event === "first") {
    return `${boot.castawayName} - Finished first`;
  }
  if (event === "second") {
    return `${boot.castawayName} - Finished second`;
  }
  if (event === "third") {
    return `${boot.castawayName} - Finished third`;
  }
  // Default logic
  return sentenceForCastaway(boot.castawayName, [
    isMeaningfulText(boot.event ?? undefined)
      ? formatBootEvent(boot.event)
      : "finished",
    isMeaningfulText(boot.tribeName ?? undefined)
      ? `from ${boot.tribeName}`
      : null,
    boot.bootOrder != null ? `boot order ${boot.bootOrder}` : null,
  ]);
}
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
  return (
    normalized !== "" &&
    normalized !== "unknown" &&
    normalized !== "none" &&
    normalized !== "n/a"
  );
}

/**
 * Join non-empty parts with bullet separator
 */
export function joinParts(parts: Array<string | null | undefined>): string {
  return parts
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(" • ");
}

/**
 * Capitalize only the first letter and lowercase the rest
 * Example: "Block a Vote" → "block a vote", "voted out" → "voted out"
 */
export function capitalizeFirstLetterOnly(
  value: string | null | undefined,
): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Convert text to sentence case (first letter uppercase)
 */
export function sentenceCase(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Format a castaway name with descriptive fragments as a sentence
 * Example: "Jeff" + ["won", "got reward"] => "Jeff - Won got reward"
 */
export function sentenceForCastaway(
  name: string,
  fragments: Array<string | null | undefined>,
): string {
  const parts = fragments.filter((part): part is string =>
    Boolean(part && part.trim().length > 0),
  );
  if (parts.length === 0) return name;
  const sentence = parts.join(" ").trim();
  const normalized = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  return `${name} - ${normalized}`;
}

/**
 * Convert camelCase or snake_case event names to human-readable format
 * Example: "foundHiddenImmunity" => "found hidden immunity"
 */
export function humanizeEvent(value: string | null | undefined): string {
  if (!value) return "";
  // First convert camelCase to spaces
  const withSpaces = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
  if (!withSpaces) return "";
  // Return lowercase version
  return withSpaces.toLowerCase();
}

/**
 * Convert success boolean or string to human-readable result text (lowercase)
 * Example: "yes" => "and it was successful"
 */
export function humanizeSuccess(value: string | null | undefined): string {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "yes" || normalized === "true")
    return "with result it was successful";
  if (normalized === "no" || normalized === "false")
    return "with result it was not successful";
  return `with result ${normalized}`;
}

/**
 * Format advantage event action text
 * Handles special cases like "beware" advantages
 */
export function advantageActionText(
  event: string | null | undefined,
  advantageType: string | null | undefined,
): string {
  const rawEvent = event?.trim().toLowerCase() || "";
  const formattedType = advantageType ? advantageType.toLowerCase() : "";
  if (rawEvent.includes("beware")) {
    return isMeaningfulText(advantageType)
      ? `Found beware advantage for ${formattedType}`
      : "Found beware advantage";
  }
  if (rawEvent === "found") {
    return isMeaningfulText(advantageType)
      ? `Found ${getIndefiniteArticle(formattedType)} ${formattedType}`
      : "Found an advantage";
  }
  if (rawEvent === "received") {
    return isMeaningfulText(advantageType)
      ? `Received ${getIndefiniteArticle(formattedType)} ${formattedType}`
      : "Received an advantage";
  }
  if (rawEvent === "expired") {
    return isMeaningfulText(advantageType)
      ? capitalizeFirstLetterOnly(`${formattedType} expired`)
      : "Advantage expired";
  }
  if (rawEvent === "activated") {
    return isMeaningfulText(advantageType)
      ? capitalizeFirstLetterOnly(`${formattedType} activated`)
      : "Advantage activated";
  }
  if (rawEvent === "absorbed") {
    return isMeaningfulText(advantageType)
      ? `Absorbed ${getIndefiniteArticle(formattedType)} ${formattedType}`
      : "Absorbed an advantage";
  }
  if (rawEvent === "banked") {
    return isMeaningfulText(advantageType)
      ? `Banked ${getIndefiniteArticle(formattedType)} ${formattedType}`
      : "Banked an advantage";
  }
  if (rawEvent.includes("became")) {
    if (isMeaningfulText(advantageType)) {
      return capitalizeFirstLetterOnly(`${formattedType} ${rawEvent}`);
    }
    return isMeaningfulText(advantageType)
      ? `Became ${formattedType}`
      : "Became an advantage";
  }
  if (rawEvent === "left game with advantage") {
    return isMeaningfulText(advantageType)
      ? `Left game with ${getIndefiniteArticle(formattedType)} ${formattedType}`
      : "Left game with advantage";
  }
  if (rawEvent === "recieved" || rawEvent === "received") {
    return isMeaningfulText(advantageType)
      ? `Received ${getIndefiniteArticle(formattedType)} ${formattedType}`
      : "Received an advantage";
  }
  if (rawEvent === "found (beware)") {
    return isMeaningfulText(advantageType)
      ? `Found (beware) ${formattedType}`
      : "Found (beware) advantage";
  }
  if (rawEvent === "played") {
    return isMeaningfulText(advantageType)
      ? `Played ${formattedType}`
      : "Played an advantage";
  }
  if (rawEvent === "voted out with advantage") {
    if (isMeaningfulText(advantageType)) {
      const article = getIndefiniteArticle(formattedType);
      return `Voted out with ${article} ${formattedType}`;
    } else {
      return "Voted out with advantage";
    }
  }
  if (rawEvent === "recieved") {
    return isMeaningfulText(advantageType)
      ? `Recieved ${getIndefiniteArticle(formattedType)} ${formattedType}`
      : "Recieved an advantage";
  }
  // fallback
  return isMeaningfulText(event)
    ? `${capitalizeFirstLetterOnly(event)}${isMeaningfulText(advantageType) ? ` a ${formattedType}` : ""}`
    : "Had an advantage event";
}

/**
 * Check if a challenge is tribal/team-based
 */
export function isTribalChallenge(
  challengeType: string | null | undefined,
): boolean {
  return Boolean(
    challengeType && challengeType.toLowerCase().includes("tribal"),
  );
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
  votesNullified: number | null | undefined,
): string {
  let action = advantageActionText(event, advantageType);

  // Handle "played" event specially - add "for" clause and votes nullified/result
  if (event?.toLowerCase() === "played") {
    const forClause = isMeaningfulText(playedForName)
      ? (playedForName ?? "").toLowerCase() === castawayName.toLowerCase()
        ? "for themselves"
        : `for ${playedForName}`
      : "";
    const formattedType = advantageType
      ? advantageType.toLowerCase()
      : "advantage";
    action = `Played ${formattedType}${forClause ? ` ${forClause}` : ""}`;
    if (votesNullified && votesNullified > 0) {
      action += ` and nullified ${votesNullified} vote${votesNullified !== 1 ? "s" : ""}`;
    }
    if (isMeaningfulText(success)) {
      const normalizedSuccess = (success ?? "").trim().toLowerCase();
      if (normalizedSuccess === "not needed" || normalizedSuccess === "no") {
        action += " (not needed)";
      }
    }
  }
  return action;
}

/**
 * Map special boot event names to human-readable descriptions
 */
const bootEventMap: Record<string, string> = {
  votedOut: "voted out",
  medevac: "medically evacuated",
  medEvac: "medically evacuated",
  quit: "quit",
  second: "finished second",
  first: "finished first",
  third: "finished third",
  lostFire: "lost fire tiebreaker",
  lostFinalFire: "lost final fire tiebreaker",
  ejected: "ejected",
  eliminated: "eliminated",
  switched: "switched tribes",
};

/**
 * Format boot event to human-readable text
 */
export function formatBootEvent(event: string | null | undefined): string {
  if (!event) return "left the game";
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
    return "Won";
  }
  if (place === totalPlaces && totalPlaces > 1) {
    return "Lost";
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
    return "th";
  }

  switch (lastDigit) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
