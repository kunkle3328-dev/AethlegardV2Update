
import { create } from 'zustand';
import { VaultEntry } from '../schemas/vault.schema';
import { embeddingService } from '../services/embeddingService';
import { useEmbeddingStore } from './embeddingStore';

interface VaultStore {
  items: VaultEntry[];
  addItem: (entry: VaultEntry) => void;
  deleteItem: (id: string) => void;
  getLatestById: (id: string) => VaultEntry | undefined;
  getHistoryById: (id: string) => VaultEntry[];
}

export const useVaultStore = create<VaultStore>((set, get) => ({
  items: JSON.parse(localStorage.getItem('aethel_vault_v2') || '[]'),
  
  addItem: (entry) => {
    set((state) => {
      const next = [entry, ...state.items];
      localStorage.setItem('aethel_vault_v2', JSON.stringify(next));
      return { items: next };
    });

    // Background Intelligence: Generate embeddings for new entry
    embeddingService.generate(entry.id, entry.content, "vault").then(record => {
      useEmbeddingStore.getState().index(record);
    }).catch(console.error);
  },

  deleteItem: (id) => set((state) => {
    const next = state.items.filter(e => e.id !== id);
    localStorage.setItem('aethel_vault_v2', JSON.stringify(next));
    return { items: next };
  }),

  getLatestById: (id) => {
    return get().items
      .filter(e => e.id === id)
      .sort((a, b) => b.version - a.version)[0];
  },

  getHistoryById: (id) => {
    return get().items
      .filter(e => e.id === id)
      .sort((a, b) => b.version - a.version);
  }
}));
