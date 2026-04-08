import { create } from 'zustand';
import api from '../api/client';

const useChallengeStore = create((set) => ({
  challenge: null,
  dayLog: null,
  challenges: [],
  isLoading: false,

  fetchChallenge: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/challenges/${id}`);
      set({ challenge: data.data, isLoading: false });
      return data.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchChallenges: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/challenges');
      set({ challenges: data.data, isLoading: false });
      return data.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createChallenge: async (startDate) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/challenges', { startDate });
      set((state) => ({
        challenge: data.data,
        challenges: [...state.challenges, data.data],
        isLoading: false,
      }));
      return data.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchTodayLog: async (challengeId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/challenges/${challengeId}/log/today`);
      set({ dayLog: data.data, isLoading: false });
      return data.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  submitDayLog: async (challengeId, logData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post(`/challenges/${challengeId}/log/today`, logData);
      set({ dayLog: data.data, isLoading: false });
      return data.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  resetChallenge: async (challengeId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post(`/challenges/${challengeId}/reset`);
      set({ challenge: data.data, isLoading: false });
      return data.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));

export default useChallengeStore;
