import type {
  GroupResponse,
  TeamResponse,
  ScoreEventBreakdown,
} from '../services/api';

export type RecapPreset = 'full' | 'tight' | 'hype';

const APP_URL = 'outdraft.joelmoffatt.com';

/** Strip "{castawayName} - " prefix from event labels (same convention as components/shared/team.tsx). */
function cleanEventLabel(eventLabel: string, castawayName: string): string {
  const prefix = `${castawayName} - `;
  return eventLabel.startsWith(prefix) ? eventLabel.slice(prefix.length) : eventLabel;
}

interface RosterContribution {
  castawayName: string;
  pointsThisEpisode: number;
  events: { label: string; points: number }[];
  eliminated: boolean;
}

interface TeamRecap {
  username: string;
  totalPoints: number;
  pointsThisEpisode: number;
  roster: RosterContribution[];
}

/** Compute per-team recap for the given episode. Sorted by totalPoints desc, username asc tiebreaker. */
export function buildTeamRecaps(
  teams: TeamResponse[],
  episodeNumber: number,
): TeamRecap[] {
  const recaps: TeamRecap[] = teams.map((team) => {
    const roster: RosterContribution[] = team.roster.map((rc) => {
      const eventsThisEp = (rc.scoreEvents ?? []).filter(
        (e) => e.episodeNumber === episodeNumber,
      );
      const castawayName = rc.castawayPerformance.castaway.name;
      return {
        castawayName,
        pointsThisEpisode: eventsThisEp.reduce((s, e) => s + e.totalPoints, 0),
        events: eventsThisEp.map((e) => ({
          label: cleanEventLabel(e.eventLabel, castawayName),
          points: e.totalPoints,
        })),
        eliminated: rc.placement === 'booted',
      };
    });

    return {
      username: team.username ?? team.teamName,
      totalPoints: team.totalPoints,
      pointsThisEpisode: roster.reduce((s, r) => s + r.pointsThisEpisode, 0),
      roster,
    };
  });

  return recaps.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return a.username.localeCompare(b.username);
  });
}

function fmtPts(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function nonEliminatedRoster(team: TeamRecap): RosterContribution[] {
  return team.roster
    .filter((r) => !r.eliminated)
    .sort((a, b) => b.pointsThisEpisode - a.pointsThisEpisode);
}

function rankMedal(rank: number): string {
  if (rank === 1) return '🏆';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  const digits = String(rank);
  return digits
    .split('')
    .map((d) => d + '️⃣')
    .join('');
}

// ─── Preset: FULL ────────────────────────────────────────────────────────────
function renderFull(
  season: number,
  episodeNumber: number,
  teams: TeamRecap[],
): string {
  const lines: string[] = [`S${season} Ep${episodeNumber} recap`, ''];
  teams.forEach((team, idx) => {
    const rank = idx + 1;
    lines.push(
      `${rank}. ${team.username}  ${fmtPts(team.pointsThisEpisode)}  (${team.totalPoints} total)`,
    );
    for (const cast of nonEliminatedRoster(team)) {
      if (cast.events.length === 0) {
        lines.push(`   ${cast.castawayName} 0`);
      } else {
        const eventStr = cast.events
          .map((e) => `${e.label.toLowerCase()} (${fmtPts(e.points)})`)
          .join(', ');
        lines.push(
          `   ${cast.castawayName} ${fmtPts(cast.pointsThisEpisode)}: ${eventStr}`,
        );
      }
    }
    lines.push('');
  });
  lines.push(APP_URL);
  return lines.join('\n');
}

// ─── Preset: TIGHT ───────────────────────────────────────────────────────────
function renderTight(
  season: number,
  episodeNumber: number,
  teams: TeamRecap[],
): string {
  const lines: string[] = [`S${season} Ep${episodeNumber} recap`, ''];
  teams.forEach((team, idx) => {
    lines.push(
      `${idx + 1}. ${team.username} ${fmtPts(team.pointsThisEpisode)} (${team.totalPoints})`,
    );
  });
  lines.push('', `See details on the app: ${APP_URL}`);
  return lines.join('\n');
}

// ─── Preset: HYPE ────────────────────────────────────────────────────────────
function renderHype(
  season: number,
  episodeNumber: number,
  teams: TeamRecap[],
): string {
  const lines: string[] = [`🔥 S${season} Ep${episodeNumber} recap 🔥`, ''];
  teams.forEach((team, idx) => {
    const rank = idx + 1;
    lines.push(
      `${rankMedal(rank)} ${team.username}  ${fmtPts(team.pointsThisEpisode)}  (${team.totalPoints})`,
    );
    const scorers = nonEliminatedRoster(team).filter(
      (r) => r.pointsThisEpisode !== 0,
    );
    if (scorers.length > 0) {
      lines.push(
        `   ${scorers.map((r) => `${r.castawayName} ${fmtPts(r.pointsThisEpisode)}`).join(' · ')}`,
      );
    }
    lines.push('');
  });
  lines.push(`👉 ${APP_URL}`);
  return lines.join('\n');
}

export function renderRecap(
  preset: RecapPreset,
  seasonNumber: number,
  episodeNumber: number,
  teams: TeamRecap[],
): string {
  switch (preset) {
    case 'full':
      return renderFull(seasonNumber, episodeNumber, teams);
    case 'tight':
      return renderTight(seasonNumber, episodeNumber, teams);
    case 'hype':
      return renderHype(seasonNumber, episodeNumber, teams);
  }
}

/** Parse a season name like "Survivor 51" / "US51" / "S51" → 51. Falls back to the id. */
export function extractSeasonNumber(group: GroupResponse): number {
  const name = group.season?.seasonName ?? '';
  const match = name.match(/(\d{1,3})/);
  if (match) return Number(match[1]);
  return group.season?.id ?? 0;
}
