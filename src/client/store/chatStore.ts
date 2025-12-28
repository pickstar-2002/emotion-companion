import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 知识库来源信息
 */
export interface SourceInfo {
  id: string;
  kbName: string;           // 知识库名称 (emotion/empathy/comfort/motivation)
  kbLabel: string;          // 知识库显示名称
  category: string;         // 分类
  scenario: string;         // 场景描述
  emotionType?: string;     // 情绪类型（如果有）
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  emotion?: string;
  sources?: SourceInfo[];
}

interface ChatState {
  messages: Message[];
  isProcessing: boolean;
  currentResponse: string;

  addMessage: (message: Message) => void;
  setProcessing: (processing: boolean) => void;
  setCurrentResponse: (response: string) => void;
  appendCurrentResponse: (text: string) => void;
  clearMessages: () => void;
  getConversationHistory: () => Array<{ role: string; content: string }>;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isProcessing: false,
      currentResponse: '',

      addMessage: (message) =>
        set((state) => {
          // 限制最多保存 100 条消息，避免 localStorage 溢出
          const newMessages = [...state.messages, message];
          const limitedMessages = newMessages.slice(-100);
          return { messages: limitedMessages };
        }),

      setProcessing: (processing) =>
        set({ isProcessing: processing }),

      setCurrentResponse: (response) =>
        set({ currentResponse: response }),

      appendCurrentResponse: (text) =>
        set((state) => ({
          currentResponse: state.currentResponse + text
        })),

      clearMessages: () =>
        set({ messages: [], currentResponse: '' }),

      getConversationHistory: () => {
        return get().messages.map(m => ({
          role: m.role,
          content: m.content
        }));
      }
    }),
    {
      name: 'emotion-companion-chat',
      storage: createJSONStorage(() => localStorage),
      // 只持久化 messages，不持久化 isProcessing 和 currentResponse
      partialize: (state) => ({
        messages: state.messages,
        _savedAt: Date.now()
      }),
      // 版本管理，如果存储格式变化可以用来迁移
      version: 1
    }
  )
);
