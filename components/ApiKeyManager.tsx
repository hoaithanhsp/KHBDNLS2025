import React, { useState, useEffect } from 'react';
import { Key, X, Check, AlertCircle, ExternalLink } from 'lucide-react';

interface ApiKeyManagerProps {
  onApiKeySet: (apiKey: string) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasKey, setHasKey] = useState<boolean>(false);

  useEffect(() => {
    // Kiểm tra xem đã có API key trong localStorage chưa
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setHasKey(true);
      onApiKeySet(storedKey);
    } else {
      setShowInput(true);
    }
  }, []);

  const validateApiKey = async (key: string): Promise<boolean> => {
    // Kiểm tra định dạng cơ bản
    if (!key.startsWith('AIza') || key.length < 30) {
      return false;
    }

    try {
      // Thử gọi API để kiểm tra key có hợp lệ không
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      );
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API key');
      return;
    }

    setIsValidating(true);
    setError('');

    const isValid = await validateApiKey(apiKey.trim());

    if (isValid) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setHasKey(true);
      setShowInput(false);
      onApiKeySet(apiKey.trim());
      setError('');
    } else {
      setError('API key không hợp lệ. Vui lòng kiểm tra lại.');
    }

    setIsValidating(false);
  };

  const handleRemoveKey = () => {
    localStorage.removeItem('gemini_api_key');
    setHasKey(false);
    setShowInput(true);
    setApiKey('');
    onApiKeySet('');
  };

  if (hasKey && !showInput) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Check className="text-green-600" size={20} />
          <span className="text-green-800 font-medium">API Key đã được cấu hình</span>
        </div>
        <button
          onClick={handleRemoveKey}
          className="text-red-600 hover:text-red-800 flex items-center space-x-1 text-sm"
        >
          <X size={16} />
          <span>Xóa key</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-blue-300 rounded-xl p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <Key className="text-blue-600 mr-2" size={24} />
        <h3 className="font-bold text-blue-900 text-lg">Cấu hình Gemini API Key</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <AlertCircle className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" size={18} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Để sử dụng ứng dụng, bạn cần API key từ Google AI Studio:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Truy cập <a 
                href="https://aistudio.google.com/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center"
              >
                Google AI Studio <ExternalLink size={12} className="ml-1" />
              </a></li>
              <li>Đăng nhập bằng tài khoản Google</li>
              <li>Nhấn "Create API Key" và sao chép key</li>
              <li>Dán key vào ô bên dưới</li>
            </ol>
            <p className="mt-2 text-xs text-blue-700">
              🔒 API key được lưu trữ an toàn trên trình duyệt của bạn, không được gửi đến server nào khác ngoài Google AI.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSaveKey()}
          placeholder="Nhập Gemini API Key (AIza...)"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          disabled={isValidating}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSaveKey}
          disabled={isValidating || !apiKey.trim()}
          className={`w-full py-3 rounded-lg font-semibold transition-all ${
            isValidating || !apiKey.trim()
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
          }`}
        >
          {isValidating ? 'Đang kiểm tra...' : 'Lưu API Key'}
        </button>
      </div>
    </div>
  );
};

export default ApiKeyManager;
