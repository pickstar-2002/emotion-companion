import React, { useEffect, useRef, useState } from 'react';
import { AvatarController, AvatarState } from './AvatarController';
import { useKeyStore } from '../../store/keyStore';

interface AvatarContainerProps {
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
  onControllerReady?: (controller: AvatarController) => void;
}

/**
 * 连接状态枚举
 * - idle: 未连接，显示连接按钮
 * - connecting: 连接中，显示加载动画
 * - connected: 已连接，数字人可用
 * - error: 连接失败，显示错误信息
 */
type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export const AvatarContainer: React.FC<AvatarContainerProps> = ({
  onSpeakingStart,
  onSpeakingEnd,
  onControllerReady
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AvatarController | null>(null);
  const [avatarState, setAvatarState] = useState<AvatarState>('offline');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 从store获取密钥
  const getXingyunAppId = useKeyStore(state => state.getXingyunAppId);
  const getXingyunAppSecret = useKeyStore(state => state.getXingyunAppSecret);

  /**
   * 连接数字人
   */
  const handleConnect = async () => {
    if (!containerRef.current) return;

    setConnectionStatus('connecting');
    setErrorMessage('');

    // 从store获取密钥
    const appId = getXingyunAppId();
    const appSecret = getXingyunAppSecret();

    const controller = new AvatarController({
      containerId: 'avatar-container',
      appId,
      appSecret,
      onStateChange: (newState) => {
        console.log('[Avatar] State changed:', newState);
        setAvatarState(newState);
      },
      onVoiceStart: () => {
        onSpeakingStart?.();
      },
      onVoiceEnd: () => {
        onSpeakingEnd?.();
      },
      onError: (error) => {
        console.error('[Avatar] Error:', error);
        const errorMsg = error?.message || String(error);
        setConnectionStatus('error');
        setErrorMessage(errorMsg);

        // 清理资源
        controllerRef.current = null;
        setAvatarState('offline');
      }
    });

    try {
      await controller.initialize();
      controllerRef.current = controller;
      setConnectionStatus('connected');

      // 将controller传递给父组件
      onControllerReady?.(controller);

      // 延迟后让数字人打招呼
      setTimeout(() => {
        try {
          controller.speakWithAction(
            '你好！我是小星，你的情绪陪伴数字人。无论开心还是难过，我都会一直陪伴着你。💕',
            'Welcome'
          );
        } catch (e) {
          console.error('[Avatar] Failed to speak welcome message:', e);
        }
      }, 2000);

    } catch (error) {
      console.error('[Avatar] Failed to initialize:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setConnectionStatus('error');
      setErrorMessage(errorMsg);
      setAvatarState('offline');
      controllerRef.current = null;
    }
  };

  /**
   * 断开数字人连接
   */
  const handleDisconnect = () => {
    controllerRef.current?.destroy();
    controllerRef.current = null;
    setConnectionStatus('idle');
    setAvatarState('offline');
    setErrorMessage('');
  };

  /**
   * 重试连接
   */
  const handleRetry = () => {
    handleConnect();
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
    };
  }, []);

  return (
    <div className="relative flex flex-col h-full">
      {/* 数字人容器 */}
      <div
        id="avatar-container"
        ref={containerRef}
        style={{ minHeight: '400px' }}
        className="flex-1 w-full bg-gradient-to-b from-pink-100 via-purple-100 to-blue-100 rounded-t-2xl relative overflow-hidden"
      >
        {/* 未连接状态 */}
        {connectionStatus === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center p-8">
              <div className="text-8xl mb-6">🤖</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">数字人已就绪</h3>
              <p className="text-gray-600 mb-6 max-w-sm">
                点击下方按钮连接数字人开始陪伴<br/>
                <span className="text-sm text-gray-400">（连接将消耗魔珐云积分）</span>
              </p>
              <button
                onClick={handleConnect}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  连接数字人
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 连接中状态 */}
        {connectionStatus === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-pink-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-3 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-gray-600 font-medium">正在连接数字人...</p>
              <p className="text-sm text-gray-400 mt-1">首次加载可能需要 10-20 秒</p>
            </div>
          </div>
        )}

        {/* 连接失败状态 */}
        {connectionStatus === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
            <div className="text-center p-6 bg-white rounded-2xl shadow-xl max-w-md mx-4">
              <div className="text-6xl mb-4">😢</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">连接失败</h3>
              <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{errorMessage}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition"
                >
                  重试
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 状态栏 */}
      <div className="flex-shrink-0 bg-white px-6 py-3 rounded-b-2xl border-t flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <StateIndicator state={avatarState} />
          <span className="text-sm text-gray-600">
            {getStateLabel(avatarState)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* 已连接时显示断开按钮 */}
          {connectionStatus === 'connected' && (
            <button
              onClick={handleDisconnect}
              className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
              title="断开连接（停止消耗积分）"
            >
              断开连接
            </button>
          )}
          <div className="text-xs text-gray-400">
            {getConnectionStatusLabel(connectionStatus)}
          </div>
        </div>
      </div>
    </div>
  );
};

const StateIndicator: React.FC<{ state: AvatarState }> = ({ state }) => {
  const getColor = () => {
    switch (state) {
      case 'speak': return 'bg-green-500 animate-pulse';
      case 'listen': return 'bg-blue-500 animate-pulse';
      case 'think': return 'bg-yellow-500 animate-pulse';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-green-400';
    }
  };

  return (
    <div className={`w-3 h-3 rounded-full ${getColor()}`} />
  );
};

const getStateLabel = (state: AvatarState): string => {
  const labels: Record<AvatarState, string> = {
    offline: '离线',
    online: '在线',
    idle: '待机',
    interactive_idle: '待机互动',
    listen: '倾听中',
    think: '思考中',
    speak: '说话中'
  };
  return labels[state] || state;
};

const getConnectionStatusLabel = (status: ConnectionStatus): string => {
  const labels: Record<ConnectionStatus, string> = {
    idle: '未连接',
    connecting: '连接中...',
    connected: '魔珐星云驱动',
    error: '连接失败'
  };
  return labels[status];
};

export default AvatarContainer;
