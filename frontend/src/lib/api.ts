import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// No-auth API client (for spectator views)
const publicApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

// ── Teams ─────────────────────────────────────────────────────────────────────
export const teamsApi = {
  create: (name: string) => api.post('/teams', { name }),
  getAll: () => api.get('/teams'),
  getOne: (id: number) => api.get(`/teams/${id}`),
  addPlayer: (name: string, teamId: number) =>
    api.post('/players', { name, teamId }),
};

// ── Matches ───────────────────────────────────────────────────────────────────
export const matchesApi = {
  create: (body: {
    teamAId: number;
    teamBId: number;
    totalOvers: number;
    tossWinnerTeamId?: number | null;
    tossDecision?: 'BAT' | 'BOWL' | null;
  }) => api.post('/matches', body),
  getAll: () => api.get('/matches'),
  getOne: (id: number) => api.get(`/matches/${id}`),
  startSecondInnings: (id: number) => api.post(`/matches/${id}/innings/2/start`),
  spectateToken: (id: number) => api.post(`/matches/${id}/spectate-token`),
};

// ── Score ─────────────────────────────────────────────────────────────────────
export const scoreApi = {
  recordBall: (payload: {
    matchId: number;
    batRuns?: number;
    extraRuns?: number;
    extraType?: string | null;
    isWicket: boolean;
    batsmanId?: number;
    nonStrikerId?: number;
    bowlerId?: number;
    wicketType?: string | null;
    wicketBatsmanId?: number | null;
    fielderId?: number | null;
    newBatsmanId?: number | null;
  }) => api.post('/score/ball', payload),
  getScore: (matchId: number) => api.get(`/score/${matchId}`),
  getBalls: (matchId: number, inningsNumber?: number) =>
    api.get(`/score/${matchId}/balls`, { params: inningsNumber ? { inningsNumber } : {} }),
  undoBall:  (matchId: number) => api.delete(`/score/ball/last/${matchId}`),
};

export const publicScoreApi = {
  getScore: (matchId: number, token: string) =>
    publicApi.get(`/public/score/${matchId}`, { params: { t: token } }),
  getBalls: (matchId: number, token: string, inningsNumber?: number) =>
    publicApi.get(`/public/score/${matchId}/balls`, { params: { t: token, ...(inningsNumber ? { inningsNumber } : {}) } }),
};

// ── Players ───────────────────────────────────────────────────────────────────
export const playersApi = {
  getAll:  ()                                              => api.get('/players'),
  getOne:  (id: number)                                   => api.get(`/players/${id}`),
  add:     (body: Record<string, unknown>)                => api.post('/players', body),
  update:  (id: number, body: Record<string, unknown>)    => api.put(`/players/${id}`, body),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getMatch: (matchId: number) => api.get(`/analytics/match/${matchId}`),
};
