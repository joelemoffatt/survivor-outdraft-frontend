import { Season, Episode, Challenge, Vote, Castaway, EpisodeDetail } from '../types/survivor';

// API Configuration
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const normalizeBaseUrl = (value: string): string => value.trim().replace(/\/+$/, '');

const PRODUCTION_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
const CONFIGURED_API_BASE_URL = PRODUCTION_API_BASE_URL ? normalizeBaseUrl(PRODUCTION_API_BASE_URL) : '';

export const API_BASE_URL = CONFIGURED_API_BASE_URL ||
  (isDevelopment
    ? 'http://localhost:8080/api'
    : 'https://your-production-url.com/api');

export const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL.replace(/\/api\/?$/, '');
  }
})();

export const getApiAssetUri = (path?: string | null): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

const configuredApiDelayMs = Number(process.env.EXPO_PUBLIC_API_DELAY_MS);
const API_DELAY_MS =
  isDevelopment && Number.isFinite(configuredApiDelayMs) && configuredApiDelayMs > 0
    ? configuredApiDelayMs
    : 0;

/**
 * Base API client for Survivor OutDraft backend
 */
class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private authFailureHandler: (() => void) | null = null;
  private getCache = new Map<string, unknown>();
  private inFlightGetRequests = new Map<string, Promise<unknown>>();

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token for subsequent requests
   */
  setToken(token: string | null) {
    this.token = token;
    this.clearGetCache();
  }

  setAuthFailureHandler(handler: (() => void) | null) {
    this.authFailureHandler = handler;
  }

  private clearGetCache() {
    this.getCache.clear();
    this.inFlightGetRequests.clear();
  }

  private async getCached<T>(endpoint: string, forceRefresh = false): Promise<T> {
    if (!forceRefresh && this.getCache.has(endpoint)) {
      return this.getCache.get(endpoint) as T;
    }

    if (!forceRefresh) {
      const inFlight = this.inFlightGetRequests.get(endpoint);
      if (inFlight) {
        return inFlight as Promise<T>;
      }
    }

    const requestPromise = this.request<T>(endpoint, { method: 'GET' })
      .then((data) => {
        this.getCache.set(endpoint, data);
        return data;
      })
      .finally(() => {
        this.inFlightGetRequests.delete(endpoint);
      });

    this.inFlightGetRequests.set(endpoint, requestPromise as Promise<unknown>);
    return requestPromise;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
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
      if (API_DELAY_MS > 0) {
        await this.sleep(API_DELAY_MS);
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText || `HTTP error! status: ${response.status}` }));
        console.error('API Error Response:', errorData);

        if (response.status === 401 && this.authFailureHandler) {
          this.authFailureHandler();
        }

        const resolvedMessage =
          (typeof errorData?.message === 'string' && errorData.message.trim().length > 0
            ? errorData.message.trim()
            : null) ||
          (typeof errorData?.error === 'string' && errorData.error.trim().length > 0
            ? errorData.error.trim()
            : null) ||
          response.statusText ||
          `HTTP error! status: ${response.status}`;

        throw new Error(resolvedMessage);
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

  // Admin user CRUD endpoints
  async getUsers(): Promise<UserRecord[]> {
    return this.get<UserRecord[]>('/v1/users');
  }

  async getUserById(id: number): Promise<UserRecord> {
    return this.get<UserRecord>(`/v1/users/${id}`);
  }

  async createUser(data: CreateUserRequest): Promise<void> {
    return this.post<void>('/v1/users', data);
  }

  async updateUser(data: UpdateUserRequest): Promise<void> {
    return this.put<void>('/v1/users', data);
  }

  async deleteUser(id: number): Promise<void> {
    return this.delete<void>(`/v1/users/${id}`);
  }

  async uploadUserAvatar(
    userId: number,
    file: { uri: string; name: string; type: string } | File,
  ): Promise<void> {
    const url = `${this.baseUrl}/v1/users/${userId}/avatar`;
    const formData = new FormData();
    if (typeof File !== 'undefined' && file instanceof File) {
      formData.append('file', file, file.name);
    } else {
      formData.append('file', file as any);
    }

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  }

  async deleteUserAvatar(userId: number): Promise<void> {
    return this.delete<void>(`/v1/users/${userId}/avatar`);
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

  async getTribes(): Promise<TribeRecord[]> {
    return this.get<TribeRecord[]>('/v1/tribes');
  }

  async getTribeMappingsByTribeId(tribeId: number): Promise<TribeMappingRecord[]> {
    return this.get<TribeMappingRecord[]>(`/v1/tribe-mappings?tribeId=${tribeId}`);
  }

  async getCastaways(seasonId: number): Promise<Castaway[]> {
    return this.getCached<Castaway[]>(`/v1/castaways?seasonId=${seasonId}`);
  }

  async searchCastaways(query: string): Promise<CastawaySearchResult[]> {
    return this.get<CastawaySearchResult[]>(`/v1/castaways/search?query=${encodeURIComponent(query)}`);
  }

  async getCastawayById(castawayId: number): Promise<Castaway> {
    return this.get<Castaway>(`/v1/castaways/${castawayId}`);
  }

  async getCastawayPerformancesByCastawayId(castawayId: number): Promise<CastawayPerformanceDetail[]> {
    return this.get<CastawayPerformanceDetail[]>(`/v1/castaway-performances?castawayId=${castawayId}`);
  }

  async getEpisodeDetail(seasonId: number, episodeNumber: number): Promise<EpisodeDetail> {
    return this.get<EpisodeDetail>(`/v1/episodes/detail?seasonId=${seasonId}&episodeNumber=${episodeNumber}`);
  }

  async getSeasonEpisodeDetails(seasonId: number): Promise<EpisodeDetail[]> {
    return this.getCached<EpisodeDetail[]>(`/v1/episodes/detail/season?seasonId=${seasonId}`, false);
  }

  // Group endpoints
  async getUserGroups(userId: number, options?: { forceRefresh?: boolean }): Promise<GroupResponse[]> {
    return this.getCached<GroupResponse[]>(`/v1/groups/user/${userId}`, Boolean(options?.forceRefresh));
  }

  async getAdminGroups(adminId: number, options?: { forceRefresh?: boolean }): Promise<GroupResponse[]> {
    return this.getCached<GroupResponse[]>(`/v1/groups/admin/${adminId}`, Boolean(options?.forceRefresh));
  }

  async getGroupById(groupId: number, options?: { forceRefresh?: boolean }): Promise<GroupResponse> {
    return this.getCached<GroupResponse>(`/v1/groups/${groupId}`, Boolean(options?.forceRefresh));
  }

  async getGroupDashboard(groupId: number, options?: { forceRefresh?: boolean }): Promise<GroupDashboardResponse> {
    return this.getCached<GroupDashboardResponse>(`/v1/groups/${groupId}/dashboard`, Boolean(options?.forceRefresh));
  }

  async markGroupAccessed(groupId: number): Promise<GroupResponse> {
    const result = await this.post<GroupResponse>(`/v1/groups/${groupId}/access`, {});
    this.clearGetCache();
    return result;
  }

  async createGroup(groupData: {
    name: string;
    admin: { id: number };
    season: { id: number };
    latestWatchedEpisode?: { id: number };
    firstScoringEpisodeNumber?: number;
    draft: {
      teamSize: number;
      style: 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR';
      scheduledAt?: string;
    };
    pointRules: Array<{ ruleType: string; points: number }>;
  }): Promise<GroupResponse> {
    const result = await this.post<GroupResponse>(`/v1/groups`, groupData);
    this.clearGetCache();
    return result;
  }

  async updateGroupSettings(
    groupId: number,
    data: {
      name: string;
      seasonId: number;
      latestWatchedEpisodeId: number | null;
      firstScoringEpisodeNumber: number;
      draft: {
        teamSize: number;
        style: 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR';
      };
      pointRules?: Array<{ ruleType: string; points: number }>;
    }
  ): Promise<GroupResponse> {
    console.log('Updating group settings with data:', data);
    const result = await this.patch<GroupResponse>(`/v1/groups/${groupId}/settings`, data);
    this.clearGetCache();
    return result;
  }

  async updateFirstScoringEpisode(groupId: number, firstScoringEpisodeNumber: number): Promise<GroupResponse> {
    const result = await this.patch<GroupResponse>(`/v1/groups/${groupId}/first-scoring-episode`, {
      firstScoringEpisodeNumber,
    });
    this.clearGetCache();
    return result;
  }

  // Team endpoints
  async getTeamByGroupAndUser(groupId: number, userId: number, options?: { forceRefresh?: boolean }): Promise<TeamResponse> {
    return this.getCached<TeamResponse>(`/v1/teams/group/${groupId}/user/${userId}`, Boolean(options?.forceRefresh));
  }

  async getTeamById(teamId: number, options?: { forceRefresh?: boolean }): Promise<TeamResponse> {
    return this.getCached<TeamResponse>(`/v1/teams/${teamId}`, Boolean(options?.forceRefresh));
  }

  async getTeamsByGroupId(groupId: number, options?: { forceRefresh?: boolean }): Promise<TeamResponse[]> {
    return this.getCached<TeamResponse[]>(`/v1/teams/group/${groupId}`, Boolean(options?.forceRefresh));
  }

  async getTeamScoreBreakdown(teamId: number, options?: { forceRefresh?: boolean }): Promise<ScoreBreakdownResponse> {
    return this.getCached<ScoreBreakdownResponse>(`/v1/teams/${teamId}/score-breakdown`, Boolean(options?.forceRefresh));
  }

  async updateTeamProfile(
    teamId: number,
    data: {
      teamName?: string;
      file?: { uri: string; name: string; type: string } | File;
    }
  ): Promise<TeamResponse> {
    const url = `${this.baseUrl}/v1/teams/${teamId}/profile`;
    const formData = new FormData();

    if (typeof data.teamName === 'string') {
      formData.append('teamName', data.teamName);
    }

    if (data.file) {
      if (typeof File !== 'undefined' && data.file instanceof File) {
        formData.append('file', data.file, data.file.name);
      } else {
        formData.append('file', data.file as any);
      }
    }

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const result = text ? (JSON.parse(text) as TeamResponse) : ({} as TeamResponse);
    this.clearGetCache();
    return result;
  }

  // Draft endpoints
  async startDraft(groupId: number): Promise<DraftDTO> {
    const result = await this.post<DraftDTO>(`/v1/drafts/group/${groupId}/start`, {});
    this.clearGetCache();
    return result;
  }

  async getDraftState(groupId: number): Promise<DraftDTO> {
    return this.get<DraftDTO>(`/v1/drafts/group/${groupId}`);
  }

  async makeDraftPick(draftId: number, castawayPerformanceId: number): Promise<DraftDTO> {
    const result = await this.post<DraftDTO>(`/v1/drafts/${draftId}/pick`, { castawayPerformanceId });
    this.clearGetCache();
    return result;
  }

  async isMyTurn(draftId: number): Promise<{ isMyTurn: boolean; pickNumber?: number }> {
    return this.get(`/v1/drafts/${draftId}/my-turn`);
  }

  async completeDraft(groupId: number): Promise<DraftDTO> {
    const result = await this.post<DraftDTO>(`/v1/drafts/group/${groupId}/complete`, {});
    this.clearGetCache();
    return result;
  }

  async resetDraft(groupId: number): Promise<DraftDTO> {
    const result = await this.post<DraftDTO>(`/v1/drafts/group/${groupId}/reset`, {});
    this.clearGetCache();
    return result;
  }

  // Invitation endpoints
  async inviteByUsername(groupId: number, username: string): Promise<GroupMemberResponse> {
    const result = await this.post<GroupMemberResponse>('/v1/group-members/invite-by-username', {
      groupId,
      username,
    });
    this.clearGetCache();
    return result;
  }

  async getPendingInvitations(userId: number): Promise<GroupMemberResponse[]> {
    return this.get<GroupMemberResponse[]>(`/v1/group-members/user/${userId}/pending`);
  }

  async acceptInvitation(memberId: number): Promise<void> {
    const result = await this.request<void>(`/v1/group-members/${memberId}/status?status=ACCEPTED`, {
      method: 'PATCH',
    });
    this.clearGetCache();
    return result;
  }

  async rejectInvitation(memberId: number): Promise<void> {
    const result = await this.delete<void>(`/v1/group-members/${memberId}`);
    this.clearGetCache();
    return result;
  }

  async getGroupMembers(groupId: number, options?: { forceRefresh?: boolean }): Promise<GroupMemberResponse[]> {
    return this.getCached<GroupMemberResponse[]>(`/v1/group-members/group/${groupId}`, Boolean(options?.forceRefresh));
  }

  async cancelInvitation(memberId: number): Promise<void> {
    const result = await this.delete<void>(`/v1/group-members/${memberId}`);
    this.clearGetCache();
    return result;
  }
}

export interface AuthResponse {
  id: number;
  token: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatarImage?: string | null;
  bio?: string | null;
}

export interface UserRecord {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  enabled: boolean;
  avatarImage?: string | null;
  bio?: string | null;
  createdAt: string;
  favoriteCastaways?: Array<{ id: number; name: string }>;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: 'USER' | 'ADMIN';
  enabled?: boolean;
}

export interface UpdateUserRequest {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
  enabled: boolean;
  bio?: string | null;
  favoriteCastaways?: Array<{ id: number; name?: string }>;
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
    teamSize: number;
    scheduledAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
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
  placement?: 'booted' | 'first' | 'second' | 'third' | 'lostFire' | null;
  scoreEvents?: ScoreEventBreakdown[];
  castawayPerformance: {
    id: number;
    seasonId?: number | null;
    castaway: {
      id: number;
      json_id?: string;
      name: string;
      full_name: string;
    };
  };
}

export interface TeamResponse {
  id: number;
  teamName: string;
  avatarImage?: string | null;
  userId?: number;
  username?: string;
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
  maxDraftsPerCastaway: number;
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

export interface GroupDashboardResponse {
  group: GroupResponse;
  members: GroupMemberResponse[];
  teams: TeamResponse[];
}

export interface CastawaySearchResult {
  castawayId: number;
  season: number;
  fullName: string;
  jsonId: string;
}

export interface TribeRecord {
  id: number;
  seasonId: number;
  seasonName: string;
  name: string;
  color: string;
}

export interface TribeMappingRecord {
  id: number;
  seasonId: number;
  episodeId: number;
  episodeNumber: number;
  castawayPerformanceId?: number;
  castawayId: number;
  castawayJsonId?: string;
  castawayName: string;
  tribeId: number;
  tribeName: string;
  status: string;
}

export interface CastawayPerformanceDetail {
  id: number;
  season?: {
    id: number;
    seasonName: string;
    version: string;
  };
  castaway?: {
    id: number;
    name: string;
    full_name: string;
  };
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

export function deriveScoreBreakdown(team: TeamResponse): ScoreBreakdownResponse {
  return {
    teamId: team.id,
    teamName: team.teamName,
    totalPoints: team.totalPoints,
    castaways: (team.roster ?? []).map((tc) => ({
      teamCastawayId: tc.id,
      castawayPerformanceId: tc.castawayPerformance.id,
      castawayName: tc.castawayPerformance.castaway.name,
      totalPoints: tc.points,
      scoreEvents: tc.scoreEvents ?? [],
    })),
  };
}

export const apiService = new ApiService();
export default apiService;
