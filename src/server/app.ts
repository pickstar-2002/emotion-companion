import express from 'express';
import cors from 'cors';

// 路由
import chatRoutes from './routes/chat.routes';
import emotionRoutes from './routes/emotion.routes';
import diaryRoutes from './routes/diary.routes';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/chat', chatRoutes);
app.use('/api/emotion', emotionRoutes);
app.use('/api/diary', diaryRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'emotion-companion', timestamp: new Date().toISOString() });
});

export default app;
