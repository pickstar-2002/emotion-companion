import dotenv from 'dotenv';
import app from './app';
// 加载环境变量
dotenv.config({ path: '.env.server' });
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n=================================`);
    console.log(`  情绪陪伴数字人服务启动`);
    console.log(`  服务地址: http://localhost:${PORT}`);
    console.log(`  前端地址: http://localhost:5173`);
    console.log(`=================================\n`);
});
