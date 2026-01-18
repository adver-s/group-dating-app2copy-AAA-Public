'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ProvisionButton() {
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisioningStatus, setProvisioningStatus] = useState('');
  const [logs, setLogs] = useState([]);

  const handleProvision = async () => {
    if (isProvisioning) return;

    setIsProvisioning(true);
    setProvisioningStatus('Starting AWS infrastructure provisioning...');
    setLogs([]);

    try {
      const response = await fetch('/api/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          try {
            const data = JSON.parse(line);
            if (data.type === 'log') {
              setLogs(prev => [...prev, data.message]);
              setProvisioningStatus(data.message);
            } else if (data.type === 'complete') {
              setProvisioningStatus('Provisioning completed successfully!');
              setIsProvisioning(false);
            } else if (data.type === 'error') {
              setProvisioningStatus(`Error: ${data.message}`);
              setIsProvisioning(false);
            }
          } catch (e) {
            // Handle non-JSON lines
            if (line.trim()) {
              setLogs(prev => [...prev, line]);
            }
          }
        });
      }
    } catch (error) {
      console.error('Provisioning error:', error);
      setProvisioningStatus(`Error: ${error.message}`);
      setIsProvisioning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            AWS インフラストラクチャプロビジョニング
          </h2>
          <p className="text-gray-600">
            ワンクリックでAWSインフラストラクチャをセットアップ
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleProvision}
            disabled={isProvisioning}
            className={`
              btn-primary text-lg font-semibold px-8 py-4
              ${isProvisioning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : ''
              }
            `}
          >
            {isProvisioning ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>プロビジョニング中...</span>
              </div>
            ) : (
              '🚀 プロビジョニング開始'
            )}
          </motion.button>
        </div>

        {provisioningStatus && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-800 font-medium">
                  {provisioningStatus}
                </span>
              </div>
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="text-green-400 font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>作成されるもの:</p>
          <ul className="mt-2 space-y-1">
            <li>• AWS Secrets Manager（データベース認証情報）</li>
            <li>• IAMロールとポリシー（EC2インスタンス用）</li>
            <li>• S3バケット（ファイルストレージ）</li>
            <li>• データベーステーブルとサンプルデータ</li>
            <li>• JWT認証トークン</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 