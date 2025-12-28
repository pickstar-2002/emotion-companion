import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApiKeys {
  // 魔搭AI密钥
  modelscopeApiKey: string;
  // 魔珐星云密钥
  xingyunAppId: string;
  xingyunAppSecret: string;
}

interface KeyState {
  keys: ApiKeys | null;
  isConfigured: boolean;
  setKeys: (keys: ApiKeys) => void;
  clearKeys: () => void;
  getKeys: () => ApiKeys | null;
  getModelScopeKey: () => string;
  getXingyunAppId: () => string;
  getXingyunAppSecret: () => string;
}

// 默认密钥（如果用户未配置，可以使用这些默认值）
const DEFAULT_KEYS: ApiKeys = {
  modelscopeApiKey: 'ms-85ed98e9-1a8e-41e5-8215-ee563559d069',
  xingyunAppId: 'b70a23de5fe34312a5a2ac0e885b5118',
  xingyunAppSecret: '26d0815b4c7d4e3db207c3ee221dbf21'
};

export const useKeyStore = create<KeyState>()(
  persist(
    (set, get) => ({
      keys: null,
      isConfigured: false,

      setKeys: (keys) => set({ keys, isConfigured: true }),

      clearKeys: () => set({ keys: null, isConfigured: false }),

      getKeys: () => get().keys,

      getModelScopeKey: () => {
        const keys = get().keys;
        return keys?.modelscopeApiKey || DEFAULT_KEYS.modelscopeApiKey;
      },

      getXingyunAppId: () => {
        const keys = get().keys;
        return keys?.xingyunAppId || DEFAULT_KEYS.xingyunAppId;
      },

      getXingyunAppSecret: () => {
        const keys = get().keys;
        return keys?.xingyunAppSecret || DEFAULT_KEYS.xingyunAppSecret;
      }
    }),
    {
      name: 'api-keys-storage',
      // 不持久化默认密钥，只存储用户输入的密钥
      partialize: (state) => ({
        keys: state.keys,
        isConfigured: state.isConfigured
      })
    }
  )
);

export default useKeyStore;
