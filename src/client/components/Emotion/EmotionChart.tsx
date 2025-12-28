import React from 'react';
import { useEmotionStore } from '../../store/emotionStore';

export const EmotionChart: React.FC = () => {
  const { getEmotionHistory } = useEmotionStore();
  const emotionHistory = getEmotionHistory(7);

  const chartData = emotionHistory.map(item => ({
    time: new Date(item.timestamp).toLocaleDateString(),
    情绪强度: item.intensity,
    情绪类型: item.emotion
  }));

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'bg-yellow-400',
      sad: 'bg-blue-400',
      angry: 'bg-red-400',
      anxious: 'bg-purple-400',
      fear: 'bg-gray-400',
      normal: 'bg-green-400'
    };
    return colors[emotion] || 'bg-gray-400';
  };

  const getEmotionLabel = (emotion: string) => {
    const labels: Record<string, string> = {
      happy: '开心',
      sad: '难过',
      angry: '生气',
      anxious: '焦虑',
      fear: '恐惧',
      normal: '平静'
    };
    return labels[emotion] || emotion;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">情绪趋势（近7天）</h3>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400">
          暂无情绪记录
        </div>
      ) : (
        <div className="space-y-3">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getEmotionColor(item.情绪类型)}`} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{item.time}</span>
                  <span className="text-sm font-medium">{getEmotionLabel(item.情绪类型)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-pink-400 to-purple-400 h-2 rounded-full transition-all"
                    style={{ width: `${item.情绪强度 * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmotionChart;
