'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface AgeVerificationGuardProps {
  children: React.ReactNode;
}

export default function AgeVerificationGuard({ children }: AgeVerificationGuardProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkVerification = async () => {
      if (loading) return;

      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }

      // 年齢確認チェックを削除 - 本人確認ページに統合済み
      // 本人確認は各機能で個別にチェックするため、ここでは認証のみチェック
      
      setIsChecking(false);
    };

    checkVerification();
  }, [isAuthenticated, loading, router]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // リダイレクト中
  }

  return <>{children}</>;
}
