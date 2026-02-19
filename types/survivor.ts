/**
 * Survivor OutDraft Type Definitions
 */

export interface Season {
  seasonId: number;
  seasonName: string;
  location: string;
  country: string;
  tribeSetup: string;
  fullName: string;
  filmingStarted: string;
  filmingEnded: string;
  premiereDate: string;
  endingDate: string;
  viewers: number;
  episodesNumber: number;
}

export interface Castaway {
  castawayId: string;
  fullName: string;
  castaway: string;
  age: number;
  city: string;
  state: string;
  personality: string;
  seasonId: number;
  season: string;
}

export interface Episode {
  seasonId: number;
  season: string;
  episodeId: number;
  episodeLabel: string;
  episodeTitle: string;
  isFinale: boolean;
  airDate: string;
  viewers: number;
  ratingShare: number;
  imdb: number;
}

export interface Challenge {
  seasonId: number;
  season: string;
  episodeId: number;
  challengeType: string;
  winners: string;
  winnersTribe: string;
  outcomeType: string;
}

export interface Vote {
  seasonId: number;
  season: string;
  episodeId: number;
  voteRound: number;
  castawayId: string;
  castaway: string;
  voteId: string;
  vote: string;
}
