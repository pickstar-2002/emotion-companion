import * as fs from 'fs';
import * as path from 'path';
export class RAGService {
    constructor() {
        this.knowledgeBase = [];
        // 知识库名称映射
        this.kbNameMap = {
            'emotion': '情绪陪伴',
            'empathy': '共情回应',
            'comfort': '安慰支持',
            'motivation': '激励鼓励'
        };
        // 记录每个条目来源的知识库
        this.itemKbMap = new Map();
        // 知识库数据路径
        this.dataPath = path.join(process.cwd(), 'data', 'knowledge');
        this.loadKnowledgeBase();
    }
    /**
     * 加载知识库数据
     */
    loadKnowledgeBase() {
        const files = ['emotion.json', 'empathy.json', 'comfort.json', 'motivation.json'];
        for (const file of files) {
            const filePath = path.join(this.dataPath, file);
            if (fs.existsSync(filePath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    this.knowledgeBase.push(...data);
                    // 记录每个条目来自哪个知识库文件
                    const kbName = file.replace('.json', '');
                    for (const item of data) {
                        this.itemKbMap.set(item.id, kbName);
                    }
                    console.log(`[RAG] Loaded ${data.length} items from ${file}`);
                }
                catch (error) {
                    console.error(`[RAG] Failed to load ${file}:`, error);
                }
            }
        }
        console.log(`[RAG] Total knowledge items loaded: ${this.knowledgeBase.length}`);
    }
    /**
     * 根据关键词检索相关知识
     */
    search(query, topK = 3) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        for (const item of this.knowledgeBase) {
            let score = 0;
            // 匹配关键词
            if (item.keywords) {
                for (const keyword of item.keywords) {
                    if (query.includes(keyword)) {
                        score += 10;
                    }
                    else if (lowerQuery.includes(keyword.toLowerCase())) {
                        score += 5;
                    }
                }
            }
            // 匹配情绪类型
            if (item.emotion_type) {
                const emotionKeywords = {
                    happy: ['开心', '高兴', '快乐', '幸福', '快乐', '喜悦'],
                    sad: ['难过', '伤心', '悲伤', '痛苦', '沮丧', '失落'],
                    angry: ['生气', '愤怒', '火大', '恼火', '气愤'],
                    anxious: ['焦虑', '担心', '紧张', '不安', '忧虑'],
                    fear: ['害怕', '恐惧', '恐慌', '担心']
                };
                const keywords = emotionKeywords[item.emotion_type] || [];
                for (const keyword of keywords) {
                    if (query.includes(keyword)) {
                        score += 5;
                    }
                }
            }
            // 匹配场景描述
            if (item.scenario) {
                const scenarioWords = item.scenario.split(/\s+/);
                for (const word of scenarioWords) {
                    if (word.length > 1 && query.includes(word)) {
                        score += 2;
                    }
                }
            }
            if (score > 0) {
                results.push({
                    item,
                    score,
                    category: item.category
                });
            }
        }
        // 按分数排序并返回topK
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }
    /**
     * 构建知识库上下文
     */
    buildContext(query) {
        const results = this.search(query, 3);
        if (results.length === 0) {
            return '';
        }
        let context = '\n\n--- 参考知识库 ---\n';
        for (const result of results) {
            const item = result.item;
            context += `\n【${item.category}】${item.scenario}\n`;
            if (item.empathy_responses && item.empathy_responses.length > 0) {
                context += `建议回应：${item.empathy_responses.join('；')}\n`;
            }
        }
        context += '--- 知识库结束 ---\n';
        return context;
    }
    /**
     * 获取知识来源信息（用于前端展示）
     */
    getSources(query) {
        const results = this.search(query, 3);
        return results.map(r => {
            const item = r.item;
            const kbName = this.itemKbMap.get(item.id) || 'unknown';
            // 提取场景描述（去掉"用户说"和引号）
            const scenarioText = item.scenario.split('用户说')[1]?.replace(/"/g, '').trim() || item.scenario;
            return {
                id: item.id,
                kbName: kbName,
                kbLabel: this.kbNameMap[kbName] || kbName,
                category: item.category,
                scenario: scenarioText,
                emotionType: item.emotion_type
            };
        });
    }
}
export default new RAGService();
