import { Router } from 'express';
import emotionService from '../services/emotionService';

const router = Router();

/**
 * POST /api/emotion/analyze
 * 分析用户情绪
 */
router.post('/analyze', (req, res) => {
  try {
    const { message } = req.body;

    const result = emotionService.analyzeEmotion(message);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[Emotion Routes] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '情绪分析失败'
    });
  }
});

/**
 * GET /api/emotion/history
 * 获取用户情绪历史记录
 */
router.get('/history', async (req, res) => {
  try {
    // TODO: 从数据库读取用户情绪历史
    res.json({
      success: true,
      data: {
        current: 'normal',
        history: []
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '获取情绪历史失败'
    });
  }
});

export default router;
