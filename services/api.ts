// API Configuration
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const API_BASE_URL = isDevelopment
  ? 'http://192.168.86.20:8080/api'  // Development
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

      const data = await response.json();
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
    return this.get<Season[]>('/v1/seasons');
  }

  async getEpisodes(seasonId: number): Promise<Episode[]> {
    return this.get<Episode[]>(`/v1/episodes?seasonId=${seasonId}`);
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

  async getGroupById(groupId: number): Promise<GroupResponse> {
    return this.get<GroupResponse>(`/v1/groups/${groupId}`);
  }

  // Team endpoints
  async getTeamByGroupAndUser(groupId: number, userId: number): Promise<TeamResponse> {
    return this.get<TeamResponse>(`/v1/teams/group/${groupId}/user/${userId}`);
  }

  async getTeamById(teamId: number): Promise<TeamResponse> {
    return this.get<TeamResponse>(`/v1/teams/${teamId}`);
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
  draftDate: string | null;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  createdAt: string;
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

export const apiService = new ApiService();
export default apiService;
