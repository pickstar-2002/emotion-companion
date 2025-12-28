import axios from 'axios';
export class ModelScopeService {
    constructor() {
        this.baseURL = 'https://api-inference.modelscope.cn/v1';
        this.apiKey = process.env.MODELSCOPE_API_KEY || 'ms-85ed98e9-1a8e-41e5-8215-ee563559d069';
        this.model = process.env.MODELSCOPE_MODEL || 'deepseek-ai/DeepSeek-V3.2';
        this.embeddingModel = process.env.MODELSCOPE_EMBEDDING_MODEL || 'Qwen/Qwen3-Embedding-8B';
        console.log('[ModelScope] API Key loaded:', !!this.apiKey);
        console.log('[ModelScope] Chat Model:', this.model);
        console.log('[ModelScope] Embedding Model:', this.embeddingModel);
    }
    async chat(options, apiKey) {
        try {
            const keyToUse = apiKey || this.apiKey;
            const requestBody = {
                model: this.model,
                messages: options.messages,
                temperature: options.temperature || 0.8,
                max_tokens: options.maxTokens || 2000
            };
            if (options.enableThinking !== false) {
                requestBody.extra_body = {
                    enable_thinking: true
                };
            }
            const response = await axios.post(`${this.baseURL}/chat/completions`, requestBody, {
                headers: {
                    'Authorization': `Bearer ${keyToUse}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.choices[0].message.content;
        }
        catch (error) {
            console.error('[ModelScope] API Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'AI服务调用失败');
        }
    }
    async *chatStream(options, apiKey) {
        try {
            const keyToUse = apiKey || this.apiKey;
            const requestBody = {
                model: this.model,
                messages: options.messages,
                temperature: options.temperature || 0.8,
                max_tokens: options.maxTokens || 2000,
                stream: true
            };
            if (options.enableThinking !== false) {
                requestBody.extra_body = {
                    enable_thinking: true
                };
            }
            console.log('[ModelScope] Starting stream request with model:', this.model);
            console.log('[ModelScope] Messages count:', options.messages.length);
            const response = await axios.post(`${this.baseURL}/chat/completions`, requestBody, {
                headers: {
                    'Authorization': `Bearer ${keyToUse}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            });
            console.log('[ModelScope] Stream response received');
            const stream = response.data;
            let doneThinking = false;
            let yieldCount = 0;
            for await (const chunk of stream) {
                const lines = chunk.toString().split('\n').filter((line) => line.trim() !== '');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            console.log('[ModelScope] Stream received [DONE]');
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            const thinkingContent = parsed.choices[0]?.delta?.reasoning_content;
                            if (thinkingContent) {
                                console.log('[ModelScope] Thinking content received');
                            }
                            const content = parsed.choices[0]?.delta?.content;
                            if (content) {
                                yieldCount++;
                                console.log(`[ModelScope] Yielding content chunk ${yieldCount}:`, content.substring(0, 10) + '...');
                                if (!doneThinking) {
                                    doneThinking = true;
                                }
                                yield content;
                            }
                        }
                        catch (e) {
                            console.log('[ModelScope] Parse error for data:', data.substring(0, 100));
                        }
                    }
                }
            }
            console.log(`[ModelScope] Stream complete, total yielded: ${yieldCount}`);
        }
        catch (error) {
            console.error('[ModelScope] Stream Error:', error.response?.data || error.message);
            console.error('[ModelScope] Full error:', error);
            throw new Error(error.response?.data?.message || 'AI流式服务调用失败');
        }
    }
    async generateEmbedding(text) {
        try {
            const response = await axios.post(`${this.baseURL}/embeddings`, {
                model: this.embeddingModel,
                input: text,
                encoding_format: 'float'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.data[0].embedding;
        }
        catch (error) {
            console.error('[ModelScope] Embedding Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || '向量嵌入服务调用失败');
        }
    }
}
export default new ModelScopeService();
