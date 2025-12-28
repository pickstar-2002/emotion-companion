import React, { useState } from 'react';
import { useKeyStore } from '../../store/keyStore';

interface KeyInputModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyInputModal: React.FC<KeyInputModalProps> = ({ isOpen, onClose }) => {
  const { setKeys } = useKeyStore();

  const [formData, setFormData] = useState({
    modelscopeApiKey: '',
    xingyunAppId: '',
    xingyunAppSecret: ''
  });

  const [showPassword, setShowPassword] = useState({
    modelscopeApiKey: false,
    xingyunAppId: false,
    xingyunAppSecret: false
  });

  const [useDefault, setUseDefault] = useState(false);

  const handleSubmit = () => {
    if (useDefault) {
      // 使用默认密钥（留空即可，store会使用默认值）
      setKeys({
        modelscopeApiKey: '',
        xingyunAppId: '',
        xingyunAppSecret: ''
      });
    } else {
      // 使用用户输入的密钥
      setKeys({
        modelscopeApiKey: formData.modelscopeApiKey,
        xingyunAppId: formData.xingyunAppId,
        xingyunAppSecret: formData.xingyunAppSecret
      });
    }
    onClose();
  };

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔑</span>
              <div>
                <h2 className="text-xl font-bold text-white">配置API密钥</h2>
                <p className="text-pink-100 text-sm">首次使用需要配置服务密钥</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* 使用默认密钥选项 */}
          <div className="mb-4">
            <label className="flex items-start gap-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border-2 border-transparent hover:border-pink-300 cursor-pointer transition">
              <input
                type="checkbox"
                checked={useDefault}
                onChange={(e) => setUseDefault(e.target.checked)}
                className="mt-1 w-4 h-4 text-pink-500 rounded focus:ring-pink-500"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">使用内置演示密钥</div>
                <p className="text-sm text-gray-600 mt-1">
                  使用项目内置的演示密钥快速体验功能。演示密钥可能有使用限制。
                </p>
              </div>
            </label>
          </div>

          {/* 自定义密钥输入 */}
          {!useDefault && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 text-center">
                如果您有自己的密钥，请填写下方配置
              </div>

              {/* 魔搭AI密钥 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  魔搭AI API密钥
                  <span className="text-gray-400 font-normal ml-2">（ModelScope）</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword.modelscopeApiKey ? 'text' : 'password'}
                    value={formData.modelscopeApiKey}
                    onChange={(e) => setFormData({ ...formData, modelscopeApiKey: e.target.value })}
                    placeholder="ms-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('modelscopeApiKey')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.modelscopeApiKey ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">用于AI对话和情绪分析</p>
              </div>

              {/* 魔珐星云 App ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  魔珐星云 App ID
                </label>
                <div className="relative">
                  <input
                    type={showPassword.xingyunAppId ? 'text' : 'password'}
                    value={formData.xingyunAppId}
                    onChange={(e) => setFormData({ ...formData, xingyunAppId: e.target.value })}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('xingyunAppId')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.xingyunAppId ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">用于3D数字人驱动</p>
              </div>

              {/* 魔珐星云 App Secret */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  魔珐星云 App Secret
                </label>
                <div className="relative">
                  <input
                    type={showPassword.xingyunAppSecret ? 'text' : 'password'}
                    value={formData.xingyunAppSecret}
                    onChange={(e) => setFormData({ ...formData, xingyunAppSecret: e.target.value })}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('xingyunAppSecret')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.xingyunAppSecret ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">用于3D数字人驱动</p>
              </div>
            </div>
          )}

          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">密钥安全说明</p>
                <ul className="text-blue-600 space-y-1 text-xs">
                  <li>• 密钥将保存在浏览器本地存储中</li>
                  <li>• 密钥仅用于客户端API调用，不会上传到服务器</li>
                  <li>• 您可以随时在设置中重新配置密钥</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-medium"
          >
            稍后配置
          </button>
          <button
            onClick={handleSubmit}
            disabled={useDefault ? false : !formData.modelscopeApiKey || !formData.xingyunAppId || !formData.xingyunAppSecret}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存并开始
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyInputModal;
