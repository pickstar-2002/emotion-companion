import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Emotion {
  emotion: 'happy' | 'sad' | 'angry' | 'anxious' | 'fear' | 'normal';
  intensity: number;
  timestamp: number;
}

interface EmotionState {
  currentEmotion: Emotion;
  emotionHistory: Emotion[];

  setCurrentEmotion: (emotion: Emotion) => void;
  addToHistory: (emotion: Emotion) => void;
  getEmotionHistory: (days?: number) => Emotion[];
}

export const useEmotionStore = create<EmotionState>()(
  persist(
    (set, get) => ({
      emotionHistory: [],
      currentEmotion: { emotion: 'normal', intensity: 0, timestamp: Date.now() },

      setCurrentEmotion: (emotion) => set({ currentEmotion: emotion }),
      addToHistory: (emotion) => set((state) => ({
        emotionHistory: [emotion, ...state.emotionHistory]
      })),
      getEmotionHistory: (days = 7) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return get().emotionHistory.filter(e => e.timestamp >= cutoffDate);
      }
    }),
    {
      name: 'emotion-storage',
      partialize: (state) => ({
        emotionHistory: state.emotionHistory.slice(0, 30)
      })
    }
  )
);
