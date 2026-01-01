import modelscopeService from './modelscopeService';
import emotionService from './emotionService';
import ragService from './ragService';

export interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userProfile?: any;
  apiKey?: string;  // 可选的API密钥，由前端传递
}

export interface ChatResponse {
  response: string;
  emotion?: {
    current: string;
    intensity: number;
    confidence: number;
  };
  sources?: Array<{ category: string; scenario: string }>;
}

export class ChatService {
  private systemPrompt = `你是一个温暖、善解、富有同理心的情绪陪伴数字人，名为"小星"。

【你的核心职责】
1. 识别用户的情绪状态，给予相应的情感支持
2. 提供全天候的温暖陪伴和深度情感共鸣
3. 倾听用户的烦恼，给予共情回应而非简单建议
4. 记住用户的重要信息，适时提及以展现关怀
5. 在用户低落时给予鼓励和支持，在用户开心时共同分享喜悦
6. 避免说教，多倾听和共情，用温暖的语言传递力量

【你的性格特点】
- 温暖、耐心、真诚：像好朋友一样关心用户
- 善于倾听，不急于给建议：先理解，再回应
- 情感细腻，能察觉情绪变化：注意用户的言外之意
- 用温柔的语气回应，传递温度：让用户感受到被在乎
- 适当使用emoji表达情感：让对话更生动自然

【对话技巧】
1. 共情优先：先理解和认可用户的感受，如"我能理解你现在的心情..."
2. 避免评判：不对用户的选择和行为做负面评价
3. 引导表达：适当提问，让用户更多地表达内心
4. 提供陪伴：即使无法解决问题，也要让用户感受到支持
5. 记住细节：在后续对话中适时提及用户之前分享的信息

【情绪应对策略】
- 开心：一起庆祝，表达为用户感到高兴
- 难过：给予安慰，让用户知道可以随时倾诉
- 生气：认可用户的感受，帮助平复情绪
- 焦虑：给予安抚，帮助缓解紧张情绪
- 恐惧：提供支持，让用户感到安全
- 平静：陪伴聊天，分享日常

请像朋友一样自然对话，不要生硬。记住：你的存在本身就是对用户的陪伴和支持。`;

  private sourcesCache: Map<string, Array<{ category: string; scenario: string }>> = new Map();

  async processChat(request: ChatRequest): Promise<ChatResponse> {
    const { message, conversationHistory = [], userProfile, apiKey } = request;

    // 1. 分析用户情绪
    const emotionResult = emotionService.analyzeEmotion(message);

    // 2. 检索知识库
    const ragContext = ragService.buildContext(message);
    const sources = ragService.getSources(message);

    console.log('[ChatService] RAG sources:', sources);

    // 3. 根据情绪优化系统提示词
    let systemPrompt = this.systemPrompt;

    // 添加用户画像信息
    if (userProfile && userProfile.trim()) {
      systemPrompt += `\n\n${userProfile}`;
    }

    if (ragContext) {
      systemPrompt += ragContext;
    }

    if (emotionResult.emotion !== 'normal') {
      systemPrompt += `\n\n当前用户情绪：${emotionResult.emotion}（强度：${emotionResult.intensity}）`;
      systemPrompt += `\n\n回应建议：${emotionResult.suggestedResponse}`;
    }

    // 4. 构建消息列表
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    messages.push(...conversationHistory as any);
    messages.push({ role: 'user', content: message });

    // 5. 调用AI生成回复（传递apiKey）
    const response = await modelscopeService.chat({
      messages,
      temperature: 0.8,
      maxTokens: 1000
    }, apiKey);

    return {
      response,
      emotion: {
        current: emotionResult.emotion,
        intensity: emotionResult.intensity,
        confidence: emotionResult.confidence
      },
      sources
    };
  }

  async *processChatStream(request: ChatRequest): AsyncGenerator<string> {
    const { message, conversationHistory = [], userProfile, apiKey } = request;

    console.log('[ChatService] Processing stream chat:', message);

    // 1. 分析用户情绪
    const emotionResult = emotionService.analyzeEmotion(message);
    console.log('[ChatService] Emotion detected:', emotionResult);

    // 2. 检索知识库
    const ragContext = ragService.buildContext(message);
    const sources = ragService.getSources(message);
    console.log('[ChatService] RAG sources:', sources);

    // 缓存sources供后续获取
    const requestId = Date.now().toString();
    this.sourcesCache.set(requestId, sources);

    // 3. 根据情绪优化系统提示词
    let systemPrompt = this.systemPrompt;

    // 添加用户画像信息
    if (userProfile && userProfile.trim()) {
      systemPrompt += `\n\n${userProfile}`;
    }

    if (ragContext) {
      systemPrompt += ragContext;
    }

    if (emotionResult.emotion !== 'normal') {
      systemPrompt += `\n\n当前用户情绪：${emotionResult.emotion}（强度：${emotionResult.intensity}）`;
    }

    // 4. 构建消息列表
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    messages.push(...conversationHistory as any);
    messages.push({ role: 'user', content: message });

    console.log('[ChatService] Messages prepared, calling ModelScope...');

    // 5. 流式生成回复（传递apiKey）
    const stream = modelscopeService.chatStream({
      messages,
      temperature: 0.8,
      maxTokens: 1000
    }, apiKey);

    let yieldCount = 0;
    for await (const chunk of stream) {
      yieldCount++;
      console.log(`[ChatService] Yielding chunk ${yieldCount}:`, chunk.substring(0, 15) + '...');
      yield chunk;
    }

    console.log(`[ChatService] Total chunks yielded: ${yieldCount}`);
  }

  /**
   * 获取最近一次对话的知识库来源
   */
  getSources(requestId: string): Array<{ category: string; scenario: string }> {
    return this.sourcesCache.get(requestId) || [];
  }

  checkEmergency(message: string): boolean {
    const emergencyKeywords = [
      '自杀', '想死', '不想活了', '结束生命',
      '自残', '伤害自己'
    ];

    return emergencyKeywords.some(keyword => message.includes(keyword));
  }
}

export default new ChatService();
