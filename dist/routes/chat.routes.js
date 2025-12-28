import { Router } from 'express';
import chatService from '../services/chatService';
const router = Router();
/**
 * POST /api/chat/send
 * 发送对话消息
 */
router.post('/send', async (req, res) => {
    try {
        const { message, conversationHistory, userProfile, apiKey } = req.body;
        // 检查紧急情况
        if (chatService.checkEmergency(message)) {
            return res.json({
                success: true,
                isEmergency: true,
                response: '我非常关心你的安全。如果你正在经历困难时期，请记得你并不孤单，有很多人愿意帮助你。请考虑联系专业心理咨询热线或寻求信任的人的帮助。我在这里也会一直陪伴你。',
                emotion: { current: 'sad', intensity: 1, confidence: 1 }
            });
        }
        const result = await chatService.processChat({
            message,
            conversationHistory,
            userProfile,
            apiKey // 传递API密钥
        });
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        console.error('[Chat Routes] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || '处理对话时发生错误'
        });
    }
});
/**
 * POST /api/chat/stream
 * 流式对话（SSE）
 */
router.post('/stream', async (req, res) => {
    try {
        const { message, conversationHistory, userProfile, apiKey } = req.body;
        console.log('[Chat Routes] Stream request received:', { message, historyLength: conversationHistory?.length });
        // 设置SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // 发送开始事件
        res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);
        console.log('[Chat Routes] Start event sent');
        // 先获取知识库来源和情绪分析
        const ragService = (await import('../services/ragService')).default;
        const emotionService = (await import('../services/emotionService')).default;
        const sources = ragService.getSources(message);
        const emotionResult = emotionService.analyzeEmotion(message);
        console.log('[Chat Routes] RAG sources for response:', sources);
        console.log('[Chat Routes] Emotion detected:', emotionResult);
        // 流式处理（传递apiKey）
        const stream = chatService.processChatStream({
            message,
            conversationHistory,
            userProfile,
            apiKey // 传递API密钥
        });
        let chunkCount = 0;
        for await (const chunk of stream) {
            chunkCount++;
            console.log(`[Chat Routes] Sending chunk ${chunkCount}:`, chunk.substring(0, 20) + '...');
            res.write(`data: ${JSON.stringify({ type: 'content', data: chunk })}\n\n`);
        }
        console.log(`[Chat Routes] Total chunks sent: ${chunkCount}`);
        // 发送结束事件（包含 sources 和 emotion）
        res.write(`data: ${JSON.stringify({
            type: 'end',
            sources,
            emotion: {
                current: emotionResult.emotion,
                intensity: emotionResult.intensity,
                confidence: emotionResult.confidence
            }
        })}\n\n`);
        res.end();
    }
    catch (error) {
        console.error('[Chat Routes] Stream Error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
        res.end();
    }
});
export default router;
