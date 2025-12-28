export class EmotionService {
    /**
     * 分析用户消息中的情绪
     */
    analyzeEmotion(message) {
        const emotionKeywords = {
            happy: ['开心', '高兴', '快乐', '幸福', '哈哈', '😊', '😄', '😁'],
            sad: ['难过', '伤心', '悲伤', '痛苦', '😢', '😭', '😞'],
            angry: ['生气', '愤怒', '火大', '恼火', '😡', '😠'],
            anxious: ['焦虑', '担心', '紧张', '不安', '😰', '😨'],
            fear: ['害怕', '恐惧', '恐慌', '😨', '😱'],
            surprised: ['惊讶', '震惊', '吃惊', '😮'],
            disgust: ['恶心', '厌恶', '🤮']
        };
        let maxScore = 0;
        let detectedEmotion = 'normal';
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            const score = keywords.reduce((count, keyword) => {
                return count + (message.includes(keyword) ? 1 : 0);
            }, 0);
            if (score > maxScore) {
                maxScore = score;
                detectedEmotion = emotion;
            }
        }
        const intensity = Math.min(maxScore / 3, 1.0);
        const responseMap = {
            happy: { emotion: 'happy', intensity, confidence: 0.8, suggestedResponse: '看你心情不错呀！有什么开心的事分享吗？😊' },
            sad: { emotion: 'sad', intensity, confidence: 0.7, suggestedResponse: '看你不太开心，愿意和我说说吗？我在这里陪着你。' },
            angry: { emotion: 'angry', intensity, confidence: 0.9, suggestedResponse: '我理解你现在可能很生气，可以和我发泄一下，我在这里倾听。' },
            anxious: { emotion: 'anxious', intensity, confidence: 0.7, suggestedResponse: '别担心，深呼吸，我在这里陪你。我们一起面对。' },
            fear: { emotion: 'fear', intensity, confidence: 0.8, suggestedResponse: '别怕，我在这里保护你。一起加油！💪' },
            surprised: { emotion: 'surprised', intensity, confidence: 0.6, suggestedResponse: '发生了什么？告诉我，我在听。' },
            normal: { emotion: 'normal', intensity: 0, confidence: 0.9, suggestedResponse: '嗨！今天想聊点什么？😊' }
        };
        return responseMap[detectedEmotion] || responseMap.normal;
    }
}
export default new EmotionService();
