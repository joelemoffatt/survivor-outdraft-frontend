// API Configuration
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const developmentApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  'http://192.168.86.20:8080/api'; // ipconfig getifaddr en0
const API_BASE_URL = isDevelopment
  ? developmentApiBaseUrl
  : 'https://your-production-url.com/api';  // Production

import { Season, Episode, Challenge, Vote, Castaway, EpisodeDetail } from '../types/survivor';

/**
 * Base API client for Survivor OutDraft backend
 */
class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token for subsequent requests
   */
  setToken(token: string | null) {
    this.token = token;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    // Print the full URL before sending the request
    console.log('API Request URL:', url);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token is available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add any additional headers from options
    if (options.headers) {
      const additionalHeaders = options.headers as Record<string, string>;
      Object.assign(headers, additionalHeaders);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses (e.g., 204 No Content or endpoints that return nothing)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('API Response: (empty or non-JSON)');
        return {} as T;
      }

      const text = await response.text();
      if (!text) {
        console.log('API Response: (empty body)');
        return {} as T;
      }

      const data = JSON.parse(text);
      console.log('API Response:', data);
      return data;
    } catch (error) { 
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth endpoints
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    return this.post<AuthResponse>('/v1/auth/register', {
      username,
      email,
      password,
    });
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    return this.post<AuthResponse>('/v1/auth/login', {
      username,
      password,
    });
  }

  // Survivor endpoints
  async getSeasons(): Promise<Season[]> {
    const seasons = await this.get<Season[]>('/v1/seasons');
    return seasons.sort((a, b) => b.season - a.season);
  }

  async getEpisodes(seasonId: number): Promise<Episode[]> {
    const episodes = await this.get<Episode[]>(`/v1/episodes?seasonId=${seasonId}`);
    return episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
  }

  async getChallenges(seasonId: number, episodeNumber: number): Promise<Challenge[]> {
    return this.get<Challenge[]>(`/v1/challenges?seasonId=${seasonId}&episodeNumber=${episodeNumber}`);
  }

  async getVotes(seasonId: number, episodeNumber: number): Promise<Vote[]> {
    return this.get<Vote[]>(`/v1/votes?seasonId=${seasonId}&episodeNumber=${episodeNumber}`);
  }

  async getCastaways(seasonId: number): Promise<Castaway[]> {
    return this.get<Castaway[]>(`/v1/castaways?seasonId=${seasonId}`);
  }

  async getEpisodeDetail(seasonId: number, episodeNumber: number): Promise<EpisodeDetail> {
    return this.get<EpisodeDetail>(`/v1/episodes/detail?seasonId=${seasonId}&episodeNumber=${episodeNumber}`);
  }

  // Group endpoints
  async getUserGroups(userId: number): Promise<GroupResponse[]> {
    return this.get<GroupResponse[]>(`/v1/groups/user/${userId}`);
  }

  async getAdminGroups(adminId: number): Promise<GroupResponse[]> {
    return this.get<GroupResponse[]>(`/v1/groups/admin/${adminId}`);
  }

  async getGroupById(groupId: number): Promise<GroupResponse> {
    return this.get<GroupResponse>(`/v1/groups/${groupId}`);
  }

  async markGroupAccessed(groupId: number): Promise<GroupResponse> {
    return this.post<GroupResponse>(`/v1/groups/${groupId}/access`, {});
  }

  async createGroup(groupData: {
    name: string;
    admin: { id: number };
    season: { id: number };
    latestWatchedEpisode?: { id: number };
    firstScoringEpisodeNumber?: number;
    teamSize: number;
    style: 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR';
    scheduledAt?: string;
    pointRules: Array<{ ruleType: string; points: number }>;
  }): Promise<GroupResponse> {
    return this.post<GroupResponse>(`/v1/groups`, groupData);
  }

  async updateGroupSettings(
    groupId: number,
    data: {
      name: string;
      seasonId: number;
      teamSize: number;
      latestWatchedEpisodeId: number | null;
      firstScoringEpisodeNumber: number;
      style: 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR';
      pointRules?: Array<{ ruleType: string; points: number }>;
    }
  ): Promise<GroupResponse> {
    console.log('Updating group settings with data:', data);
    return this.patch<GroupResponse>(`/v1/groups/${groupId}/settings`, data);
  }

  async updateFirstScoringEpisode(groupId: number, firstScoringEpisodeNumber: number): Promise<GroupResponse> {
    return this.patch<GroupResponse>(`/v1/groups/${groupId}/first-scoring-episode`, {
      firstScoringEpisodeNumber,
    });
  }

  // Team endpoints
  async getTeamByGroupAndUser(groupId: number, userId: number): Promise<TeamResponse> {
    return this.get<TeamResponse>(`/v1/teams/group/${groupId}/user/${userId}`);
  }

  async getTeamById(teamId: number): Promise<TeamResponse> {
    return this.get<TeamResponse>(`/v1/teams/${teamId}`);
  }

  async getTeamsByGroupId(groupId: number): Promise<TeamResponse[]> {
    return this.get<TeamResponse[]>(`/v1/teams/group/${groupId}`);
  }

  async getTeamScoreBreakdown(teamId: number): Promise<ScoreBreakdownResponse> {
    return this.get<ScoreBreakdownResponse>(`/v1/teams/${teamId}/score-breakdown`);
  }

  // Draft endpoints
  async startDraft(groupId: number): Promise<DraftDTO> {
    return this.post<DraftDTO>(`/v1/drafts/group/${groupId}/start`, {});
  }

  async getDraftState(groupId: number): Promise<DraftDTO> {
    return this.get<DraftDTO>(`/v1/drafts/group/${groupId}`);
  }

  async makeDraftPick(draftId: number, castawayPerformanceId: number): Promise<DraftDTO> {
    return this.post<DraftDTO>(`/v1/drafts/${draftId}/pick`, { castawayPerformanceId });
  }

  async isMyTurn(draftId: number): Promise<{ isMyTurn: boolean; pickNumber?: number }> {
    return this.get(`/v1/drafts/${draftId}/my-turn`);
  }

  async completeDraft(groupId: number): Promise<DraftDTO> {
    return this.post<DraftDTO>(`/v1/drafts/group/${groupId}/complete`, {});
  }

  async resetDraft(groupId: number): Promise<DraftDTO> {
    return this.post<DraftDTO>(`/v1/drafts/group/${groupId}/reset`, {});
  }

  // Invitation endpoints
  async inviteByUsername(groupId: number, username: string): Promise<GroupMemberResponse> {
    return this.post<GroupMemberResponse>('/v1/group-members/invite-by-username', {
      groupId,
      username,
    });
  }

  async getPendingInvitations(userId: number): Promise<GroupMemberResponse[]> {
    return this.get<GroupMemberResponse[]>(`/v1/group-members/user/${userId}/pending`);
  }

  async acceptInvitation(memberId: number): Promise<void> {
    return this.request<void>(`/v1/group-members/${memberId}/status?status=ACCEPTED`, {
      method: 'PATCH',
    });
  }

  async rejectInvitation(memberId: number): Promise<void> {
    return this.delete<void>(`/v1/group-members/${memberId}`);
  }

  async getGroupMembers(groupId: number): Promise<GroupMemberResponse[]> {
    return this.get<GroupMemberResponse[]>(`/v1/group-members/group/${groupId}`);
  }

  async cancelInvitation(memberId: number): Promise<void> {
    return this.delete<void>(`/v1/group-members/${memberId}`);
  }
}

export interface AuthResponse {
  id: number;
  token: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface GroupResponse {
  id: number;
  name: string;
  admin: {
    id: number;
    username: string;
  };
  season: {
    id: number;
    seasonName: string;
    version: string;
  };
  draft?: {
    id: number;
    status: 'PENDING' | 'DRAFTING' | 'COMPLETED';
    style: 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR';
    scheduledAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
  teamSize: number | null;
  firstScoringEpisodeNumber: number;
  latestEpisodeWatched?: {
    id: number;
    episodeNumber: number;
    episodeTitle?: string;
  } | null;
  status: 'PENDING' | 'DRAFTING' | 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  pointRules?: Array<{
    ruleType: string;
    points: number;
  }>;
}

export interface TeamCastawayResponse {
  id: number;
  draftOrder: number;
  points: number;
  draftedAt: string;
  castawayPerformance: {
    id: number;
    castaway: {
      id: number;
      name: string;
      full_name: string;
    };
  };
}

export interface TeamResponse {
  id: number;
  teamName: string;
  totalPoints: number;
  createdAt: string;
  roster: TeamCastawayResponse[];
}

export interface DraftUserSummary {
  id: number;
  username: string;
}

export interface DraftGroupSummary {
  id: number;
  name: string;
}

export interface DraftTeamSummary {
  id: number;
  teamName: string;
}

export interface DraftParticipant {
  id: number;
  draftPosition: number;
  user: DraftUserSummary;
  teamId: number;
  teamName: string;
  picksMade: number;
  active: boolean;
}

export interface DraftPickSlot {
  id: number;
  pickNumber: number;
  roundNumber: number;
  draftPosition: number;
  user: DraftUserSummary;
  team: DraftTeamSummary;
  isPicked: boolean;
  castawayPerformanceId?: number;
  castawayName?: string;
  pickedAt?: string;
}

export interface DraftCastaway {
  draftId: number;
  castawayPerformanceId: number;
  castawayName: string;
}

export interface DraftDTO {
  id: number;
  group: DraftGroupSummary;
  seasonId: number;
  seasonName: string;
  createdBy?: DraftUserSummary;
  status: 'PENDING' | 'DRAFTING' | 'COMPLETED';
  style: 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR';
  isComplete: boolean;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  teamSize: number;
  totalParticipants: number;
  totalCastaways: number;
  totalPicks: number;
  participants: DraftParticipant[];
  maxDraftsPerCastaway: number;
  currentPickNumber: number;
  currentTurnUser?: DraftUserSummary;
  picks: DraftPickSlot[];
  draftCastaways: DraftCastaway[];
}

export interface CastawayPerformance {
  id: number;
  castaway: {
    id: number;
    name: string;
    full_name: string;
  };
}

export interface GroupMemberResponse {
  id: number;
  group: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    username: string;
    email: string;
  };
  status: 'INVITED' | 'ACCEPTED' | 'DECLINED';
  joinedAt: string;
  lastAccessedAt?: string | null;
}

export interface ScoreEventBreakdown {
  id: number;
  episodeNumber: number | null;
  eventLabel: string;
  totalPoints: number;
}

export interface CastawayScoreBreakdown {
  teamCastawayId: number;
  castawayPerformanceId: number;
  castawayName: string;
  totalPoints: number;
  scoreEvents: ScoreEventBreakdown[];
}

export interface ScoreBreakdownResponse {
  teamId: number;
  teamName: string;
  totalPoints: number;
  castaways: CastawayScoreBreakdown[];
}

export const apiService = new ApiService();
export default apiService;
