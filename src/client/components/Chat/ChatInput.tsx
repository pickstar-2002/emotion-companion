import React, { useState, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isProcessing = useChatStore((state) => state.isProcessing);
  const currentResponse = useChatStore((state) => state.currentResponse);

  const isDisabled = isProcessing || disabled;
  const canSend = input.trim() && !isDisabled;

  const handleSend = () => {
    if (canSend) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('您的浏览器不支持语音识别');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-4 transition-all duration-300 ${
      isProcessing ? 'ring-2 ring-pink-200' : ''
    }`}>
      <div className="flex items-center space-x-4">
        {/* 语音按钮 */}
        <button
          onClick={isRecording ? stopVoiceInput : startVoiceInput}
          className={`p-4 rounded-xl transition-all duration-200 ${
            isRecording
              ? 'bg-red-100 text-red-600 animate-pulse'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isDisabled}
          title={isRecording ? '停止录音' : '语音输入'}
        >
          {isRecording ? '🛑' : '🎤'}
        </button>

        {/* 输入框 */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isProcessing ? '小星正在思考中...' : '和我说说话吧...'}
            className={`w-full px-6 py-4 border rounded-xl text-lg transition-all duration-200 ${
              isDisabled
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
            }`}
            disabled={isDisabled}
          />
          {/* 处理中的加载指示器 */}
          {isProcessing && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-sm text-pink-500">小星正在回复</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
        </div>

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          className={`px-8 py-4 rounded-xl font-medium transition-all duration-200 ${
            isDisabled || !input.trim()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 hover:shadow-lg hover:scale-105'
          }`}
          disabled={isDisabled || !input.trim()}
          title={canSend ? '发送消息 (Enter)' : '请输入消息'}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              处理中
            </span>
          ) : (
            '发送'
          )}
        </button>
      </div>

      {/* 状态提示 */}
      <div className="mt-2 text-center text-sm text-gray-400">
        {isRecording ? (
          <span className="text-red-500 animate-pulse">🎤 正在录音...</span>
        ) : isProcessing ? (
          <span className="text-pink-500">💭 小星正在认真思考如何回复你...</span>
        ) : (
          <span>按 Enter 发送，Shift+Enter 换行，或点击 🎤 语音输入</span>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
