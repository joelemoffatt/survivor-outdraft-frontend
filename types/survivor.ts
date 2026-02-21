/**
 * Survivor OutDraft Type Definitions
 */

export interface Season {
  seasonId: number;
  version: string;
  seasonName?: string;
  location?: string;
  country?: string;
  tribeSetup?: string;
  fullName?: string;
  filmingStarted?: string;
  filmingEnded?: string;
  premiereDate?: string;
  endingDate?: string;
  viewers?: number;
  episodesNumber?: number;
}

export interface Episode {
  id: number;
  seasonId: number;
  episodeNumber: number;
  episodeTitle: string;
  episodeDate: string;
  episodeLength: number;
  isFinale: boolean;
  episodeSummary?: string;
}

export interface Castaway {
  id: number;
  json_id: string;
  name: string;
  full_name: string;
  age?: number;
  city?: string;
  state?: string;
  gender: string;
  occupation: string;
  hobbies?: string;
  pet_peeves?: string;
  three_words?: string;
}

export interface Challenge {
  id: number;
  seasonId: number;
  episodeId: number;
  challenge_id: number;
  challenge_number: number;
  challenge_type: string;
  name: string;
  balance?: boolean;
  endurance?: boolean;
  puzzle?: boolean;
  precision?: boolean;
  water?: boolean;
}

export interface Vote {
  id: number;
  voteRoundId: number;
  castawayId: number;
  votedForId: number;
  nullified?: boolean;
}

export interface ChallengePerformanceRow {
  castawayName: string;
  place?: number | null;
  won?: boolean;
  satOut?: boolean;
}

export interface TribePerformanceGroup {
  tribeName: string;
  performances: ChallengePerformanceRow[];
}

export interface ChallengeDetail {
  title: string;
  type: string;
  number?: number | null;
  performancesByTribe: TribePerformanceGroup[];
}

export interface JourneyDetail {
  castawayName: string;
  event?: string | null;
  reward?: string | null;
  lostVote?: boolean | null;
  choseToPlay?: boolean | null;
}

export interface AdvantageMovementDetail {
  castawayName: string;
  playedForName?: string | null;
  advantageType?: string | null;
  event?: string | null;
  success?: string | null;
  votesNullified?: number | null;
}

export interface TribalVoteRow {
  voterName: string;
  votedForName: string;
  nullified?: boolean | null;
}

export interface TribalDetail {
  tribeName: string;
  bootOrder?: number | null;
  votedOutName: string;
  votes: TribalVoteRow[];
}

export interface BootDetail {
  castawayName: string;
  event?: string | null;
  bootOrder?: number | null;
  tribeName?: string | null;
}

export interface JuryVoteDetail {
  voterName: string;
  votedForName: string;
}

export interface FinalRankingDetail {
  castawayName: string;
  placement: string;
  voteCount: number;
}

export interface EpisodeDetail {
  episodeTitle: string;
  episodeNumber: number;
  challenges: ChallengeDetail[];
  journeys: JourneyDetail[];
  advantageMovements: AdvantageMovementDetail[];
  tribals: TribalDetail[];
  boots: BootDetail[];
  finalResultsBoots: BootDetail[];
  juryVotes: JuryVoteDetail[];
  finalThreeRanking: FinalRankingDetail[];
}
