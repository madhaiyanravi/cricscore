import { create } from 'zustand';

interface AuthState {
  token: string | null;
  email: string | null;
  setAuth: (token: string, email: string) => void;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  email: null,

  setAuth: (token, email) => {
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    set({ token, email });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    set({ token: null, email: null });
  },

  init: () => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (token && email) set({ token, email });
  },
}));
