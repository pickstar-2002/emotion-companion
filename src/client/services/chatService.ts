const API_BASE = '/api';

/**
 * 默认密钥（与 api.txt 保持一致）
 */
const DEFAULT_MODELSCOPE_KEY = 'ms-85ed98e9-1a8e-41e5-8215-ee563559d069';

/**
 * 从store获取ModelScope密钥的辅助函数
 * 在服务中需要动态导入store来避免循环依赖
 */
async function getModelScopeKey(): Promise<string> {
  // 从localStorage读取密钥
  const stored = localStorage.getItem('api-keys-storage');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      // 如果用户配置了keys，使用用户配置的
      if (data.state.keys?.modelscopeApiKey) {
        return data.state.keys.modelscopeApiKey;
      }
    } catch (e) {
      console.error('[chatService] Failed to parse stored keys:', e);
    }
  }
  // 返回默认密钥
  return DEFAULT_MODELSCOPE_KEY;
}

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

export interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userProfile?: any;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  emotion?: {
    current: string;
    intensity: number;
    confidence: number;
  };
  sources?: SourceInfo[];
  isEmergency?: boolean;
  error?: string;
}

export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const apiKey = await getModelScopeKey();
    const response = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...request,
        apiKey  // 传递API密钥到后端
      })
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '网络请求失败'
    };
  }
}

export async function sendMessageStream(
  request: ChatRequest,
  onChunk: (chunk: string) => void,
  onComplete: (sources?: SourceInfo[], emotion?: { current: string; intensity: number; confidence: number }) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    console.log('[Frontend] Starting stream request:', request);
    const apiKey = await getModelScopeKey();
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...request,
        apiKey  // 传递API密钥到后端
      })
    });

    console.log('[Frontend] Response received, status:', response.status);

    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法读取响应流');

    const decoder = new TextDecoder();
    let chunkCount = 0;
    let sources: SourceInfo[] = [];
    let emotion: { current: string; intensity: number; confidence: number } | undefined;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('[Frontend] Stream done, total chunks:', chunkCount);
        onComplete(sources, emotion);
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'content') {
              chunkCount++;
              console.log(`[Frontend] Chunk ${chunkCount}:`, parsed.data.substring(0, 15) + '...');
              onChunk(parsed.data);
            } else if (parsed.type === 'end') {
              console.log('[Frontend] Received end event, sources:', parsed.sources, 'emotion:', parsed.emotion);
              sources = parsed.sources || [];
              emotion = parsed.emotion;
              onComplete(sources, emotion);
              return;
            } else if (parsed.type === 'error') {
              console.error('[Frontend] Error event:', parsed.data);
              onError(parsed.data);
              return;
            } else if (parsed.type === 'start') {
              console.log('[Frontend] Stream started');
            }
          } catch (e) {
            console.log('[Frontend] Parse error:', data.substring(0, 100));
          }
        }
      }
    }
  } catch (error: any) {
    console.error('[Frontend] Stream error:', error);
    onError(error.message || '流式请求失败');
  }
}

export default {
  sendMessage,
  sendMessageStream
};
