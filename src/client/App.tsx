import React, { useEffect, useRef, useState } from 'react';
import AvatarContainer from './components/Avatar/AvatarContainer';
import { ChatInput } from './components/Chat/ChatInput';
import { useChatStore, SourceInfo } from './store/chatStore';
import { useEmotionStore } from './store/emotionStore';
import { useKeyStore } from './store/keyStore';
import { sendMessageStream } from './services/chatService';
import { AvatarController, EmotionType } from './components/Avatar/AvatarController';
import { KeyInputModal } from './components/Common/KeyInputModal';

/**
 * 知识库图标映射
 */
const KB_ICON_MAP: Record<string, string> = {
  'emotion': '💝',     // 情绪陪伴
  'empathy': '🤝',     // 共情回应
  'comfort': '🫂',     // 安慰支持
  'motivation': '💪'   // 激励鼓励
};

/**
 * 富文本渲染函数
 * 支持换行、加粗、列表等格式
 */
function renderRichText(text: string): React.ReactNode {
  if (!text) return null;

  // 按行分割
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // 处理加粗 **text**
    let processedLine = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // 处理斜体 *text*
    processedLine = processedLine.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // 处理代码 `text`
    processedLine = processedLine.replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-1 rounded text-sm">$1</code>');

    // 检查是否是列表项
    const isListItem = /^[\s]*[-•·]\s/.test(line);
    const isNumberedListItem = /^[\s]*\d+\.\s/.test(line);

    if (isListItem) {
      return (
        <li key={lineIdx} className="ml-4">
          <span dangerouslySetInnerHTML={{ __html: processedLine.replace(/^[\s]*[-•·]\s/, '') }} />
        </li>
      );
    }

    if (isNumberedListItem) {
      return (
        <li key={lineIdx} className="ml-4 list-decimal">
          <span dangerouslySetInnerHTML={{ __html: processedLine.replace(/^[\s]*(\d+\.\s)/, '$1') }} />
        </li>
      );
    }

    // 检查是否是标题
    if (line.startsWith('### ')) {
      return (
        <h3 key={lineIdx} className="text-lg font-semibold mt-3 mb-1">
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={lineIdx} className="text-xl font-bold mt-3 mb-1">
          {line.slice(3)}
        </h2>
      );
    }

    // 普通段落
    if (processedLine.trim()) {
      return (
        <p key={lineIdx} className="mb-1 last:mb-0">
          <span dangerouslySetInnerHTML={{ __html: processedLine }} />
        </p>
      );
    }

    return <br key={lineIdx} />;
  });
}

/**
 * 情绪统计面板 - 替代情绪日记功能
 */
const EmotionStatsPanel: React.FC = () => {
  const { getEmotionHistory } = useEmotionStore();
  const emotionHistory = getEmotionHistory(7);

  // 计算统计数据
  const stats = React.useMemo(() => {
    const emotionCounts: Record<string, number> = {};
    const emotionIntensities: Record<string, number[]> = {};

    emotionHistory.forEach(item => {
      emotionCounts[item.emotion] = (emotionCounts[item.emotion] || 0) + 1;
      if (!emotionIntensities[item.emotion]) {
        emotionIntensities[item.emotion] = [];
      }
      emotionIntensities[item.emotion].push(item.intensity);
    });

    // 计算最常见的情绪
    const mostCommon = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0];

    // 计算平均强度
    const avgIntensity = emotionHistory.length > 0
      ? emotionHistory.reduce((sum, item) => sum + item.intensity, 0) / emotionHistory.length
      : 0;

    // 计算每种情绪的平均强度
    const emotionAvgIntensity: Record<string, number> = {};
    Object.entries(emotionIntensities).forEach(([emotion, intensities]) => {
      emotionAvgIntensity[emotion] = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    });

    return {
      totalRecords: emotionHistory.length,
      mostCommon: mostCommon ? { emotion: mostCommon[0], count: mostCommon[1] } : null,
      avgIntensity,
      emotionAvgIntensity,
      todayRecords: emotionHistory.filter(item => {
        const today = new Date().toDateString();
        return new Date(item.timestamp).toDateString() === today;
      }).length
    };
  }, [emotionHistory]);

  const emotionLabels: Record<string, { label: string; emoji: string; color: string }> = {
    happy: { label: '开心', emoji: '😊', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
    sad: { label: '难过', emoji: '😢', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    angry: { label: '生气', emoji: '😡', color: 'bg-red-50 text-red-600 border-red-200' },
    anxious: { label: '焦虑', emoji: '😰', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    fear: { label: '恐惧', emoji: '😨', color: 'bg-gray-50 text-gray-600 border-gray-200' },
    normal: { label: '平静', emoji: '😐', color: 'bg-green-50 text-green-600 border-green-200' }
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">情绪统计（近7天）</h3>

      {emotionHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm">开始对话后，这里会显示你的情绪统计</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 总体统计 */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-pink-600">{stats.totalRecords}</div>
              <div className="text-xs text-gray-500">总记录数</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.todayRecords}</div>
              <div className="text-xs text-gray-500">今日记录</div>
            </div>
          </div>

          {/* 最常见情绪 */}
          {stats.mostCommon && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">最常见情绪</div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${emotionLabels[stats.mostCommon.emotion]?.color || 'bg-gray-50'}`}>
                <span className="text-lg">{emotionLabels[stats.mostCommon.emotion]?.emoji}</span>
                <span className="text-sm font-medium">{emotionLabels[stats.mostCommon.emotion]?.label}</span>
                <span className="text-xs opacity-70">{stats.mostCommon.count}次</span>
              </div>
            </div>
          )}

          {/* 各情绪统计 */}
          <div className="space-y-2">
            <div className="text-xs text-gray-500">各情绪平均强度</div>
            {Object.entries(stats.emotionAvgIntensity).map(([emotion, avgIntensity]) => {
              const info = emotionLabels[emotion];
              if (!info) return null;
              return (
                <div key={emotion} className={`flex items-center justify-between p-2 rounded-lg border ${info.color}`}>
                  <span className="text-sm">{info.emoji} {info.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-current opacity-60"
                        style={{ width: `${avgIntensity * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{Math.round(avgIntensity * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 总体情绪强度 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-2">总体情绪强度</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 transition-all"
                  style={{ width: `${stats.avgIntensity * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">{Math.round(stats.avgIntensity * 100)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const controllerRef = useRef<AvatarController | null>(null);
  const [showPanel, setShowPanel] = useState<'stats' | 'quick' | null>(null);
  // 记录哪些消息的知识库来源被展开
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  // 密钥管理
  const { isConfigured } = useKeyStore();
  const [showKeyModal, setShowKeyModal] = useState(false);

  // 情绪管理
  const { setCurrentEmotion, addToHistory } = useEmotionStore();

  // 检查是否需要显示密钥输入弹窗
  useEffect(() => {
    // 如果没有配置密钥，显示输入弹窗
    if (!isConfigured) {
      // 延迟一点显示，让用户先看到页面
      const timer = setTimeout(() => {
        setShowKeyModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConfigured]);

  const {
    messages,
    addMessage,
    setProcessing,
    currentResponse,
    setCurrentResponse,
    appendCurrentResponse,
    getConversationHistory,
    clearMessages
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  const handleSendMessage = async (text: string) => {
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    });

    setProcessing(true);
    setCurrentResponse('');

    controllerRef.current?.setListen();

    const history = getConversationHistory();
    let accumulatedResponse = '';

    await sendMessageStream(
      { message: text, conversationHistory: history },
      (chunk) => {
        accumulatedResponse += chunk;
        appendCurrentResponse(chunk);
      },
      async (sources?: SourceInfo[], emotion?: { current: string; intensity: number; confidence: number }) => {
        console.log('[App] Stream complete, full response:', accumulatedResponse);
        console.log('[App] Knowledge sources:', sources);
        console.log('[App] User emotion:', emotion);

        // 保存用户情绪到store
        if (emotion) {
          const emotionData = {
            emotion: emotion.current as any,
            intensity: emotion.intensity,
            timestamp: Date.now()
          };
          setCurrentEmotion(emotionData);
          addToHistory(emotionData);
        }

        // 先清空流式响应，避免重复显示
        setCurrentResponse('');
        setProcessing(false);

        // 再添加消息到历史记录
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: accumulatedResponse,
          timestamp: Date.now(),
          sources
        });

        if (controllerRef.current && accumulatedResponse) {
          try {
            // 将情绪字符串转换为 EmotionType
            const emotionType = (emotion?.current || 'normal') as EmotionType;
            console.log('[App] Speaking with emotion:', emotionType);
            await controllerRef.current.speakFullText(accumulatedResponse, emotionType);
            console.log('[App] speakFullText completed');
          } catch (error) {
            console.error('[App] speakFullText error:', error);
          }
        }
      },
      (error) => {
        console.error('[App] Stream error:', error);
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '抱歉，我遇到了一些问题。请稍后再试。',
          timestamp: Date.now()
        });
        setCurrentResponse('');
        setProcessing(false);
        controllerRef.current?.setIdle();
      }
    );
  };

  const handleNewChat = () => {
    if (currentResponse || messages.some(m => m.role === 'assistant')) {
      clearMessages();
      controllerRef.current?.setIdle();
      controllerRef.current?.speakWithAction(
        '新对话开始！我是小星，随时准备倾听你的心声。💕',
        'Welcome'
      );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm flex-shrink-0">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">💕</span>
            <h1 className="text-xl font-bold text-gray-800">情绪陪伴数字人</h1>
          </div>
          <button
            onClick={() => setShowKeyModal(true)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 text-sm font-medium transition flex items-center gap-2"
            title="重新配置API密钥"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            设置
          </button>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 w-full overflow-hidden p-6">
        <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左侧：数字人 - 占3/5 */}
          <div className="lg:col-span-3 flex flex-col">
            <AvatarContainer
              onSpeakingStart={() => console.log('开始说话')}
              onSpeakingEnd={() => console.log('结束说话')}
              onControllerReady={(controller) => {
                controllerRef.current = controller;
                console.log('[App] Controller ready');
              }}
            />
          </div>

          {/* 右侧：对话区域 - 占2/5 */}
          <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
            {/* 对话记录区域 */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden relative">
              <div className="px-6 py-4 border-b flex justify-between items-center relative z-10">
                <h2 className="text-lg font-semibold text-gray-800">对话记录</h2>
                <div className="flex items-center gap-3">
                  {/* 功能气泡按钮 */}
                  <button
                    onClick={() => setShowPanel(showPanel === 'quick' ? null : 'quick')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition ${
                      showPanel === 'quick'
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    title="快捷倾诉"
                  >
                    💬
                  </button>
                  <button
                    onClick={() => setShowPanel(showPanel === 'stats' ? null : 'stats')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition ${
                      showPanel === 'stats'
                        ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    title="情绪统计"
                  >
                    📈
                  </button>
                  <div className="w-px h-6 bg-gray-200"></div>
                  <button
                    onClick={handleNewChat}
                    className="text-sm px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition font-medium"
                  >
                    新对话
                  </button>
                </div>
              </div>

              {/* 浮动面板 */}
              {showPanel && (
                <div className="absolute top-16 right-4 z-20 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 animate-fade-in">
                  {showPanel === 'quick' && (
                    <div className="p-4 max-h-96 overflow-y-auto">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">快捷倾诉</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          // 工作相关
                          { label: '工作压力大', emoji: '🏢', text: '最近工作压力很大，事情做不完，感觉很焦虑', color: 'from-red-50 to-orange-50' },
                          { label: '被领导批评', emoji: '😔', text: '今天被领导批评了，心情很不好', color: 'from-gray-50 to-slate-50' },
                          { label: '加班太累', emoji: '😩', text: '连续加班好几天了，身体和精神都很疲惫', color: 'from-purple-50 to-indigo-50' },
                          { label: '升职加薪', emoji: '🎉', text: '太棒了！我升职加薪了，想找人分享这份喜悦', color: 'from-yellow-50 to-amber-50' },

                          // 学习相关
                          { label: '考试紧张', emoji: '📚', text: '马上要考试了，很紧张，担心考不好', color: 'from-blue-50 to-cyan-50' },
                          { label: '学习遇到困难', emoji: '📝', text: '学习上遇到了很多困难，不知道怎么突破', color: 'from-indigo-50 to-blue-50' },
                          { label: '拿到好成绩', emoji: '🏆', text: '这次考试成绩很好，付出的努力终于有回报了', color: 'from-green-50 to-emerald-50' },
                          { label: '毕业迷茫', emoji: '🎓', text: '快毕业了，对未来感到很迷茫，不知道该怎么办', color: 'from-slate-50 to-gray-50' },

                          // 人际关系
                          { label: '和朋友的矛盾', emoji: '💔', text: '和好朋友吵架了，心里很难受', color: 'from-pink-50 to-rose-50' },
                          { label: '感情问题', emoji: '💕', text: '感情上遇到了一些问题，不知道该怎么处理', color: 'from-red-50 to-pink-50' },
                          { label: '家庭矛盾', emoji: '🏠', text: '和家人有些矛盾，让我很困扰', color: 'from-orange-50 to-red-50' },
                          { label: '感到孤独', emoji: '😔', text: '最近感觉很孤独，没有人可以倾诉', color: 'from-gray-50 to-zinc-50' },

                          // 生活日常
                          { label: '失眠困扰', emoji: '😴', text: '最近总是失眠，晚上睡不着，白天没精神', color: 'from-violet-50 to-purple-50' },
                          { label: '经济压力', emoji: '💰', text: '最近经济压力比较大，不知道怎么规划开支', color: 'from-emerald-50 to-teal-50' },
                          { label: '搬家烦恼', emoji: '📦', text: '最近在搬家，很多事情要处理，感觉很累', color: 'from-amber-50 to-yellow-50' },
                          { label: '身体不适', emoji: '🤒', text: '最近身体不太舒服，有点担心', color: 'from-rose-50 to-pink-50' },

                          // 情绪发泄
                          { label: '无缘无故烦躁', emoji: '😤', text: '今天不知道为什么，突然感觉很烦躁', color: 'from-red-50 to-orange-50' },
                          { label: '想找人聊天', emoji: '💭', text: '只是想找人随便聊聊，打发时间', color: 'from-sky-50 to-blue-50' },
                        ].map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              handleSendMessage(item.text);
                              setShowPanel(null);
                            }}
                            className={`p-3 bg-gradient-to-br ${item.color} rounded-lg text-sm hover:opacity-80 transition text-left`}
                          >
                            <span className="text-lg">{item.emoji}</span>
                            <p className="text-gray-700 mt-1 text-xs leading-tight">{item.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {showPanel === 'stats' && (
                    <EmotionStatsPanel />
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-2xl">
                      <div
                        className={`px-5 py-3 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {/* 用户消息使用简单文本，助手消息使用富文本渲染 */}
                        {message.role === 'user' ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                            {renderRichText(message.content)}
                          </div>
                        )}
                        <span className={`text-xs mt-2 block ${message.role === 'user' ? 'opacity-60' : 'text-gray-400'}`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* 知识库来源显示 - 标准引用格式 */}
                      {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                        <div className="mt-3">
                          {/* 展开/收起按钮 */}
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedSources);
                              if (newExpanded.has(message.id)) {
                                newExpanded.delete(message.id);
                              } else {
                                newExpanded.add(message.id);
                              }
                              setExpandedSources(newExpanded);
                            }}
                            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors group"
                          >
                            <span className="text-gray-400">─</span>
                            <span>📚</span>
                            <span className="font-medium">参考来源</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">
                              {message.sources.length}
                            </span>
                            <span className={`ml-1 transition-transform duration-200 ${expandedSources.has(message.id) ? 'rotate-180' : ''}`}>
                              ▼
                            </span>
                          </button>

                          {/* 知识库来源详情（展开时显示） */}
                          {expandedSources.has(message.id) && (
                            <div className="mt-2 pl-4 pr-2 py-3 bg-gray-50 rounded-lg border-l-2 border-gray-200">
                              <div className="space-y-3">
                                {message.sources.map((source, idx) => (
                                  <div key={idx} className="text-xs leading-relaxed">
                                    {/* 引用编号和标题 */}
                                    <div className="flex items-start gap-2">
                                      <span className="text-gray-400 font-mono">[{idx + 1}]</span>
                                      <div className="flex-1">
                                        {/* 知识库名称 */}
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm">{KB_ICON_MAP[source.kbName] || '📚'}</span>
                                          <span className="font-semibold text-gray-700">
                                            {source.kbLabel}
                                          </span>
                                          {source.emotionType && (
                                            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-medium">
                                              {source.emotionType}
                                            </span>
                                          )}
                                        </div>
                                        {/* 场景描述 */}
                                        <p className="text-gray-600 pl-6">
                                          {source.scenario}
                                        </p>
                                        {/* 数据ID */}
                                        <p className="text-gray-400 pl-6 mt-0.5 font-mono text-[10px]">
                                          #{source.id}
                                        </p>
                                      </div>
                                    </div>
                                    {/* 分隔线（最后一个不显示） */}
                                    {idx < message.sources.length - 1 && (
                                      <div className="ml-6 mt-3 h-px bg-gray-200"></div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {currentResponse && (
                  <div className="flex justify-start">
                    <div className="max-w-2xl px-5 py-3 rounded-2xl bg-gray-100 text-gray-800">
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                        {renderRichText(currentResponse)}
                      </div>
                      <span className="inline-block w-2 h-4 bg-pink-400 animate-pulse ml-1 align-middle" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 输入区域 */}
            <div className="flex-shrink-0 mt-4">
              <ChatInput onSend={handleSendMessage} />
            </div>
          </div>
        </div>
      </main>

      {/* 密钥输入弹窗 */}
      <KeyInputModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
      />
    </div>
  );
}

export default App;
