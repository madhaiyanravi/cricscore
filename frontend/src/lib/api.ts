import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
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
  create: (teamAId: number, teamBId: number, totalOvers: number) =>
    api.post('/matches', { teamAId, teamBId, totalOvers }),
  getAll: () => api.get('/matches'),
  getOne: (id: number) => api.get(`/matches/${id}`),
};

// ── Score ─────────────────────────────────────────────────────────────────────
export const scoreApi = {
  recordBall: (payload: {
    matchId: number;
    runs: number;
    extraType?: string | null;
    isWicket: boolean;
    currentBatsman?: string;
  }) => api.post('/score/ball', payload),
  getScore: (matchId: number) => api.get(`/score/${matchId}`),
  undoBall:  (matchId: number) => api.delete(`/score/ball/last/${matchId}`),
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
