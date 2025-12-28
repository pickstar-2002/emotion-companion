export type AvatarState =
  | 'offline'
  | 'online'
  | 'idle'
  | 'interactive_idle'
  | 'listen'
  | 'think'
  | 'speak';

export type EmotionType = 'happy' | 'sad' | 'angry' | 'anxious' | 'fear' | 'surprised' | 'normal';

export interface SpeakOptions {
  text: string;
  isStart?: boolean;
  isEnd?: boolean;
}

export interface AvatarConfig {
  containerId: string;
  appId: string;
  appSecret: string;
  onStateChange?: (state: AvatarState) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  onError?: (error: any) => void;
}

export class AvatarController {
  private sdk: any = null;
  private config: AvatarConfig;
  private currentVoiceState: 'start' | 'end' | null = null;

  // 情绪到动作/表情的映射
  private static readonly EMOTION_ACTIONS: Record<EmotionType, string> = {
    happy: 'Happy',        // 开心 - 欢快动作
    sad: 'Sad',            // 难过 - 悲伤表情
    angry: 'Angry',        // 生气 - 愤怒表情
    anxious: 'Worried',    // 焦虑 - 担忧表情
    fear: 'Scared',        // 害怕 - 恐惧表情
    surprised: 'Surprise', // 惊讶 - 惊讶表情
    normal: 'Idle'         // 正常 - 待机状态
  };

  // 情绪到说话动作的映射（带情感的说话动作）
  private static readonly EMOTION_SPEAK_ACTIONS: Record<EmotionType, string> = {
    happy: 'Happy_Talk',
    sad: 'Sad_Talk',
    angry: 'Angry_Talk',
    anxious: 'Worried_Talk',
    fear: 'Scared_Talk',
    surprised: 'Surprise_Talk',
    normal: 'Talk'
  };

  constructor(config: AvatarConfig) {
    this.config = config;
    // 确保 containerId 有 # 前缀
    if (!config.containerId.startsWith('#')) {
      this.config = { ...config, containerId: `#${config.containerId}` };
    }
  }

  async initialize(): Promise<void> {
    try {
      // 检查环境变量
      if (!this.config.appId || !this.config.appSecret) {
        throw new Error('APP_ID 或 APP_SECRET 未配置');
      }

      // 加载 SDK
      if (!(window as any).XmovAvatar) {
        console.log('[Avatar] Loading SDK...');
        await this.loadSDK();
        console.log('[Avatar] SDK loaded');
      }

      // 等待容器元素存在
      await this.waitForContainer();

      // 额外延迟确保SDK完全加载
      await new Promise(resolve => setTimeout(resolve, 500));

      const XmovAvatar = (window as any).XmovAvatar;
      if (!XmovAvatar) {
        throw new Error('SDK 加载失败，请检查网络连接');
      }

      console.log('[Avatar] Creating SDK instance with config:', {
        containerId: this.config.containerId,
        appId: this.config.appId.substring(0, 8) + '...',
        gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session'
      });

      this.sdk = new XmovAvatar({
        containerId: this.config.containerId,
        appId: this.config.appId,
        appSecret: this.config.appSecret,
        gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session',

        onWidgetEvent: (data: any) => {
          console.log('[Avatar] Widget Event:', data);
        },

        proxyWidget: {
          'widget_pic': (data: any) => {
            console.log('[Avatar] Image Widget:', data);
          },
          'widget_slideshow': (data: any) => {
            console.log('[Avatar] Slideshow Widget:', data);
          }
        },

        onStateChange: (state: string) => {
          console.log('[Avatar] State changed to:', state);
          this.config.onStateChange?.(state as AvatarState);
        },

        onVoiceStateChange: (status: string) => {
          this.currentVoiceState = status as 'start' | 'end';
          if (status === 'start') {
            this.config.onVoiceStart?.();
          } else if (status === 'end') {
            this.config.onVoiceEnd?.();
          }
        },

        onNetworkInfo: (info: any) => {
          console.log('[Avatar] Network Info:', info);
        },

        onMessage: (message: any) => {
          console.log('[Avatar] SDK Message:', message);

          // 处理常见错误
          if (message?.code === 10003) {
            // 积分不足错误
            const errorMsg = '魔珐星云账户积分不足，无法启动数字人。请联系管理员充值或更新 APP_ID 和 APP_SECRET';
            this.config.onError?.(new Error(errorMsg));
            this.config.onStateChange?.('offline');
            // 标记初始化失败，防止 isInitialized 被设置为 true
            this.sdk = null;
          }
        },

        enableLogger: true
      });

      // 初始化 SDK
      await this.sdk.init({
        onDownloadProgress: (progress: number) => {
          console.log(`[Avatar] Loading progress: ${progress}%`);
        },
        onError: (error: any) => {
          console.error('[Avatar] SDK init error:', error);
          this.config.onError?.(new Error(error?.message || 'SDK 初始化失败'));
          // 标记初始化失败
          this.sdk = null;
        },
        onClose: () => {
          console.log('[Avatar] Connection closed');
          this.config.onStateChange?.('offline');
          this.config.onError?.(new Error('连接已关闭'));
          // 标记初始化失败
          this.sdk = null;
        }
      });

      // 检查是否有积分错误
      if (!this.sdk) {
        throw new Error('数字人连接失败，请检查账户积分或网络连接');
      }

      console.log('[Avatar] SDK initialized successfully');
    } catch (error) {
      console.error('[Avatar] Initialize failed:', error);
      throw error;
    }
  }

  private loadSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 检查是否已经在加载中
      if (document.querySelector('script[src*="youling-lite-sdk"]')) {
        console.log('[Avatar] SDK already loading, waiting...');
        // 等待已存在的脚本加载完成
        const checkSDK = () => {
          if ((window as any).XmovAvatar) {
            resolve();
          } else {
            setTimeout(checkSDK, 100);
          }
        };
        checkSDK();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://media.youyan.xyz/youling-lite-sdk/index.umd.0.1.0-alpha.45.js';
      script.crossOrigin = 'anonymous';

      // 设置超时
      const timeout = setTimeout(() => {
        reject(new Error('SDK 加载超时，请检查网络连接'));
      }, 30000);

      script.onload = () => {
        clearTimeout(timeout);
        console.log('[Avatar] SDK script loaded');
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('SDK 脚本加载失败，请检查网络连接或防火墙设置'));
      };

      document.head.appendChild(script);
    });
  }

  private waitForContainer(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 移除 # 前缀来查找元素
      const elementId = this.config.containerId.startsWith('#')
        ? this.config.containerId.slice(1)
        : this.config.containerId;

      const checkContainer = () => {
        const container = document.getElementById(elementId);
        if (container) {
          console.log(`[Avatar] Container found: ${elementId}`);
          // 使用 requestAnimationFrame 确保 DOM 完全渲染
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              console.log(`[Avatar] DOM fully rendered, proceeding with SDK init`);
              resolve();
            });
          });
        } else {
          console.log(`[Avatar] Waiting for container: ${elementId}`);
          setTimeout(checkContainer, 100);
        }
      };

      checkContainer();

      // 超时保护
      setTimeout(() => {
        const container = document.getElementById(elementId);
        if (!container) {
          reject(new Error(`Container ${elementId} not found after timeout`));
        }
      }, 10000);
    });
  }

  setIdle(): void {
    this.sdk?.idle();
  }

  setInteractiveIdle(): void {
    this.sdk?.interactive_idle();
  }

  setListen(): void {
    this.sdk?.listen();
  }

  setThink(): void {
    this.sdk?.think();
  }

  /**
   * 根据情绪设置数字人表情/状态
   */
  setEmotionalState(emotion: EmotionType): void {
    const action = AvatarController.EMOTION_ACTIONS[emotion];
    console.log(`[Avatar] Setting emotional state: ${emotion} -> ${action}`);

    // 使用动作触发表情变化
    this.speakWithAction('', action);
  }

  /**
   * 带情绪的说话（根据情绪调整说话动作）
   */
  speakWithEmotion(text: string, emotion: EmotionType = 'normal'): void {
    const speakAction = AvatarController.EMOTION_SPEAK_ACTIONS[emotion];
    console.log(`[Avatar] Speaking with emotion: ${emotion} -> ${speakAction}`);

    const ssml = `<speak>
      <ue4event>
        <type>ka</type>
        <data><action_semantic>${speakAction}</action_semantic></data>
      </ue4event>
      ${text}
    </speak>`;

    this.speak({ text: ssml });
  }

  speak(options: SpeakOptions): void {
    const { text, isStart = true, isEnd = true } = options;
    console.log('[Avatar] speak called:', { textLength: text?.length, isStart, isEnd });
    console.log('[Avatar] speak text preview:', text?.substring(0, 50) + '...');
    console.log('[Avatar] SDK available:', !!this.sdk);

    if (!this.sdk) {
      console.error('[Avatar] SDK not initialized!');
      return;
    }

    this.sdk.speak(text, isStart, isEnd);
    console.log('[Avatar] SDK speak method called');
  }

  async speakStream(textStream: AsyncIterable<string> | Generator<string>): Promise<void> {
    let isFirst = true;
    let buffer = '';

    for await (const chunk of textStream) {
      buffer += chunk;

      if (buffer.length > 15) {
        this.speak({ text: buffer, isStart: isFirst, isEnd: false });
        buffer = '';
        isFirst = false;
      }
    }

    if (buffer) {
      this.speak({ text: buffer, isStart: isFirst, isEnd: true });
    }
  }

  speakWithAction(text: string, action: string): void {
    const ssml = `<speak>
      <ue4event>
        <type>ka</type>
        <data><action_semantic>${action}</action_semantic></data>
      </ue4event>
      ${text}
    </speak>`;

    this.speak({ text: ssml });
  }

  /**
   * 分段播放长文本（支持情绪）
   */
  async speakFullText(text: string, emotion: EmotionType = 'normal'): Promise<void> {
    console.log('[Avatar] speakFullText called, text length:', text.length, 'emotion:', emotion);
    if (!text || text.length === 0) return;

    const CHUNK_SIZE = 100;
    const DELAY_MS = 500;

    console.log('[Avatar] Text is short enough, speaking directly with emotion:', emotion);

    // 手动触发状态变化，确保UI更新
    this.config.onStateChange?.('speak');

    // 根据情绪选择说话方式
    if (emotion !== 'normal') {
      // 使用带情绪的说话方式
      this.speakWithEmotion(text, emotion);
    } else {
      // 普通说话
      this.speak({ text, isStart: true, isEnd: true });
    }

    console.log('[Avatar] Speak command sent');

    // 等待说话完成（根据文本长度估算时间）
    const estimatedTime = Math.max(3000, text.length * 100);
    console.log(`[Avatar] Waiting ${estimatedTime}ms for speech to complete...`);

    await new Promise(resolve => setTimeout(resolve, estimatedTime));

    // 说话完成后设置为待机状态
    this.config.onStateChange?.('idle');
    console.log('[Avatar] Speech completed, set to idle');

    return;

    // 如果文本较长，分段播放
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.slice(i, i + CHUNK_SIZE));
    }

    console.log(`[Avatar] Split into ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      console.log(`[Avatar] Speaking chunk ${i + 1}/${chunks.length}, isLast: ${isLast}`);
      console.log(`[Avatar] Chunk content:`, chunks[i].substring(0, 30) + '...');

      this.speak({
        text: chunks[i],
        isStart: i === 0,
        isEnd: isLast
      });

      if (!isLast) {
        console.log(`[Avatar] Waiting ${DELAY_MS}ms before next chunk...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    console.log('[Avatar] All chunks sent');
  }

  destroy(): void {
    this.sdk?.destroy();
    this.sdk = null;
  }
}

export default AvatarController;
