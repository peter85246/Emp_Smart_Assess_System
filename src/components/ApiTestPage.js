import React, { useState } from 'react';
import { authAPI } from '../services/authAPI';

const ApiTestPage = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testApiConnection = async () => {
    setLoading(true);
    setTestResult('測試中...');
    
    try {
      // 測試登入API
      const response = await authAPI.login({
        employeeNumber: 'EMP001',
        password: '123456'
      });
      
      setTestResult(`✅ API連接成功！\n用戶: ${response.data.user.name}\n角色: ${response.data.user.role}`);
    } catch (error) {
      console.error('API測試失敗:', error);
      setTestResult(`❌ API連接失敗：\n${error.message}\n${error.response?.data?.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          API 連接測試
        </h1>
        
        <button
          onClick={testApiConnection}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
        >
          {loading ? '測試中...' : '測試 API 連接'}
        </button>
        
        {testResult && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">測試結果：</h3>
            <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-600">
          <h4 className="font-semibold mb-2">測試帳號：</h4>
          <ul className="space-y-1">
            <li>員工: EMP001 / 123456</li>
            <li>主管: EMP003 / 123456</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;
