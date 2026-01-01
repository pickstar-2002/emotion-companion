import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 用户记忆类型
 */
export type MemoryType =
  | 'preference'      // 偏好（喜欢/不喜欢）
  | 'important_day'   // 重要日子
  | 'personal_info'   // 个人信息
  | 'habit'           // 习惯
  | 'goal'            // 目标
  | 'relationship'    // 人际关系
  | 'health'          // 健康状况
  | 'concern'         // 关注点/担忧
  | 'achievement';    // 成就

/**
 * 单条记忆
 */
export interface Memory {
  id: string;
  type: MemoryType;
  key: string;           // 记忆的关键词（如"生日"、"最喜欢的食物"）
  value: string;         // 记忆的内容
  importance: number;    // 重要性 1-5
  createdAt: number;
  updatedAt: number;
  lastMentioned: number; // 最后一次被提及的时间
  mentionCount: number;  // 被提及次数
}

interface MemoryState {
  memories: Memory[];

  // 添加记忆
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'lastMentioned' | 'mentionCount'>) => void;

  // 更新记忆
  updateMemory: (id: string, updates: Partial<Memory>) => void;

  // 删除记忆
  deleteMemory: (id: string) => void;

  // 提及记忆（增加提及次数和更新时间）
  mentionMemory: (key: string) => void;

  // 获取所有记忆
  getAllMemories: () => Memory[];

  // 按类型获取记忆
  getMemoriesByType: (type: MemoryType) => Memory[];

  // 搜索记忆
  searchMemories: (keyword: string) => Memory[];

  // 获取重要记忆（importance >= 4）
  getImportantMemories: () => Memory[];

  // 获取最近提及的记忆
  getRecentMemories: (days?: number) => Memory[];

  // 构建用户画像（用于 AI 上下文）
  buildUserProfile: () => string;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      memories: [],

      addMemory: (memoryData) => {
        const newMemory: Memory = {
          ...memoryData,
          id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastMentioned: Date.now(),
          mentionCount: 1
        };

        set((state) => {
          // 检查是否已存在相同 key 的记忆
          const existingIndex = state.memories.findIndex(m => m.key === memoryData.key);
          if (existingIndex >= 0) {
            // 更新现有记忆
            const updated = [...state.memories];
            updated[existingIndex] = {
              ...updated[existingIndex],
              value: memoryData.value,
              importance: Math.max(updated[existingIndex].importance, memoryData.importance),
              updatedAt: Date.now(),
              lastMentioned: Date.now(),
              mentionCount: updated[existingIndex].mentionCount + 1
            };
            return { memories: updated };
          }
          // 添加新记忆，最多保存 100 条
          return { memories: [...state.memories, newMemory].slice(-100) };
        });
      },

      updateMemory: (id, updates) => {
        set((state) => ({
          memories: state.memories.map(m =>
            m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m
          )
        }));
      },

      deleteMemory: (id) => {
        set((state) => ({
          memories: state.memories.filter(m => m.id !== id)
        }));
      },

      mentionMemory: (key) => {
        set((state) => ({
          memories: state.memories.map(m =>
            m.key === key
              ? {
                  ...m,
                  lastMentioned: Date.now(),
                  mentionCount: m.mentionCount + 1
                }
              : m
          )
        }));
      },

      getAllMemories: () => {
        return get().memories;
      },

      getMemoriesByType: (type) => {
        return get().memories.filter(m => m.type === type);
      },

      searchMemories: (keyword) => {
        const lowerKeyword = keyword.toLowerCase();
        return get().memories.filter(m =>
          m.key.toLowerCase().includes(lowerKeyword) ||
          m.value.toLowerCase().includes(lowerKeyword)
        );
      },

      getImportantMemories: () => {
        return get().memories.filter(m => m.importance >= 4);
      },

      getRecentMemories: (days = 7) => {
        const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
        return get().memories.filter(m => m.lastMentioned >= cutoffDate);
      },

      buildUserProfile: () => {
        const memories = get().memories;
        if (memories.length === 0) return '';

        const typeLabels: Record<MemoryType, string> = {
          preference: '偏好',
          important_day: '重要日子',
          personal_info: '个人信息',
          habit: '习惯',
          goal: '目标',
          relationship: '人际关系',
          health: '健康状况',
          concern: '关注点',
          achievement: '成就'
        };

        // 按类型分组
        const grouped: Record<MemoryType, Memory[]> = {
          preference: [],
          important_day: [],
          personal_info: [],
          habit: [],
          goal: [],
          relationship: [],
          health: [],
          concern: [],
          achievement: []
        };

        memories.forEach(m => {
          grouped[m.type].push(m);
        });

        // 构建用户画像文本
        const profile: string[] = [];

        Object.entries(grouped).forEach(([type, items]) => {
          if (items.length > 0) {
            const typeLabel = typeLabels[type as MemoryType];
            const itemsText = items
              .filter(m => m.importance >= 3) // 只包含重要性 >= 3 的记忆
              .map(m => `${m.key}: ${m.value}`)
              .join('; ');
            if (itemsText) {
              profile.push(`【${typeLabel}】${itemsText}`);
            }
          }
        });

        return profile.length > 0 ? `用户画像：\n${profile.join('\n')}` : '';
      }
    }),
    {
      name: 'emotion-companion-memory',
      storage: createJSONStorage(() => localStorage),
      version: 1
    }
  )
);

/**
 * 从对话中提取记忆的辅助函数
 * 这个函数会在 AI 回复后调用，尝试从对话中提取有用的用户信息
 */
export const extractMemoriesFromConversation = (
  userMessage: string,
  aiResponse: string
): Array<Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'lastMentioned' | 'mentionCount'>> => {
  const memories: Array<Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'lastMentioned' | 'mentionCount'>> = [];

  // 简单规则提取（实际应用中可以用 AI 来提取）

  // 提取生日
  const birthdayMatch = userMessage.match(/(?:我的生日是|生日)(?:在|是)?(\d+月\d+日?)/);
  if (birthdayMatch) {
    memories.push({
      type: 'important_day',
      key: '生日',
      value: birthdayMatch[1],
      importance: 5
    });
  }

  // 提取喜好
  if (userMessage.includes('我喜欢') || userMessage.includes('我爱')) {
    const likeMatch = userMessage.match(/(?:我喜欢|我爱)(.{2,10})(?:，|。|$)/);
    if (likeMatch) {
      memories.push({
        type: 'preference',
        key: '喜欢的' + likeMatch[1].substring(0, 2),
        value: likeMatch[1].trim(),
        importance: 3
      });
    }
  }

  // 提取不喜欢
  if (userMessage.includes('我讨厌') || userMessage.includes('我不喜欢')) {
    const dislikeMatch = userMessage.match(/(?:我讨厌|我不喜欢)(.{2,10})(?:，|。|$)/);
    if (dislikeMatch) {
      memories.push({
        type: 'preference',
        key: '不喜欢的' + dislikeMatch[1].substring(0, 2),
        value: dislikeMatch[1].trim(),
        importance: 3
      });
    }
  }

  // 提取职业
  if (userMessage.includes('我是') && (userMessage.includes('工程师') || userMessage.includes('设计师') || userMessage.includes('学生'))) {
    const jobMatch = userMessage.match(/我是(.{2,6})/);
    if (jobMatch) {
      memories.push({
        type: 'personal_info',
        key: '职业',
        value: jobMatch[1].trim(),
        importance: 4
      });
    }
  }

  return memories;
};
