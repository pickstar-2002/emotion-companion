import React, { useState } from 'react';

export const EmotionDiary: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('normal');

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    console.log('保存日记:', { title, content, mood });
    // TODO: 调用API保存日记

    setTitle('');
    setContent('');
    setMood('normal');
  };

  const moodOptions = [
    { value: 'happy', label: '😊 开心', color: 'bg-yellow-50 text-yellow-600 ring-yellow-500' },
    { value: 'sad', label: '😢 难过', color: 'bg-blue-50 text-blue-600 ring-blue-500' },
    { value: 'anxious', label: '😰 焦虑', color: 'bg-purple-50 text-purple-600 ring-purple-500' },
    { value: 'angry', label: '😡 生气', color: 'bg-red-50 text-red-600 ring-red-500' },
    { value: 'normal', label: '😐 平静', color: 'bg-gray-50 text-gray-600 ring-gray-500' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">情绪日记</h3>

      <div className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="今天发生了什么？"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的想法吧..."
          rows={5}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <div>
          <p className="text-sm text-gray-600 mb-2">现在的心情：</p>
          <div className="flex flex-wrap gap-2">
            {moodOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setMood(option.value)}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  mood === option.value
                    ? `${option.color} ring-2 font-medium`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2.5 rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition"
        >
          保存日记
        </button>
      </div>
    </div>
  );
};

export default EmotionDiary;
