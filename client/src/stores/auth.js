import { defineStore } from 'pinia';
import { api } from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('travelcheck_token'),
    user: JSON.parse(localStorage.getItem('travelcheck_user') || 'null')
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },
  actions: {
    async login(payload) {
      const result = await api.login(payload);
      this.setSession(result);
    },
    async register(payload) {
      const result = await api.register(payload);
      this.setSession(result);
    },
    async requestPasswordReset(email) {
      return api.requestPasswordReset(email);
    },
    async confirmPasswordReset(payload) {
      const result = await api.confirmPasswordReset(payload);
      this.setSession(result);
      return result;
    },
    setSession({ token, user }) {
      this.token = token;
      this.user = user;
      localStorage.setItem('travelcheck_token', token);
      localStorage.setItem('travelcheck_user', JSON.stringify(user));
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('travelcheck_token');
      localStorage.removeItem('travelcheck_user');
    }
  }
});
