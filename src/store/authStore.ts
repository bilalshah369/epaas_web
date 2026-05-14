import { create } from 'zustand';
import { TOKEN_STORAGE_KEY } from '@/services/api';
import * as authService from '@/services/auth.service';
import type {
  AuthUser,
  LoginApplicantRequest,
  LoginAuthorityRequest,
  RegisterRequest,
} from '@/types/auth.types';
// Re-export so consumers can import from one place
export type { AuthUser };

interface AuthState {
  user:            AuthUser | null;
  token:           string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  isRestoring:     boolean;

  loginApplicant:  (data: LoginApplicantRequest) => Promise<void>;
  loginAuthority:  (data: LoginAuthorityRequest) => Promise<void>;
  register:        (data: RegisterRequest) => Promise<void>;
  logout:          () => void;
  restoreSession:  () => Promise<void>;
  updateUser:      (partial: Partial<AuthUser>) => void;
}

function persist(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  token:           localStorage.getItem(TOKEN_STORAGE_KEY),
  isAuthenticated: !!localStorage.getItem(TOKEN_STORAGE_KEY),
  isLoading:       false,
  // true while we're re-hydrating user from a stored token on page refresh
  isRestoring:     !!localStorage.getItem(TOKEN_STORAGE_KEY),

  loginApplicant: async (data) => {
    set({ isLoading: true });
    try {
      const { user, token } = await authService.loginApplicant(data);
      persist(token);
      set({ user, token, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  loginAuthority: async (data) => {
    set({ isLoading: true });
    try {
      const { user, token } = await authService.loginAuthority(data);
      persist(token);
      set({ user, token, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const { user, token } = await authService.register(data);
      persist(token);
      set({ user, token, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (partial) => {
    set((state) => ({ user: state.user ? { ...state.user, ...partial } : null }));
  },

  // Called on app init to re-hydrate user object from a stored token
  restoreSession: async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      set({ isRestoring: false });
      return;
    }
    try {
      const user = await authService.getMe();
      set({ user, token, isAuthenticated: true, isRestoring: false });
    } catch {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      set({ user: null, token: null, isAuthenticated: false, isRestoring: false });
    }
  },
}));
