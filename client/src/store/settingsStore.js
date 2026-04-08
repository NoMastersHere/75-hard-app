import { create } from 'zustand';
import api from '../api/client';

const useSettingsStore = create((set) => ({
  settings: null,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/settings');
      set({ settings: data.data, isLoading: false });
      return data.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateSettings: async (updates) => {
    set({ isLoading: true });
    try {
      const { data } = await api.put('/settings', updates);
      set({ settings: data.data, isLoading: false });
      return data.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));

export default useSettingsStore;
