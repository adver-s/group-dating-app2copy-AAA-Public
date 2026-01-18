// AWS Comprehendのパッケージがインストールされていないため、一時的にダミー関数に置き換え

export interface TextAnalysisResult {
  isAppropriate: boolean;
  sentiment: string;
  confidence: number;
  reasons: string[];
  piiDetected: boolean;
  piiEntities: string[];
}

/**
 * テキストの感情分析と不適切性を検出（ダミー実装）
 */
export async function analyzeText(text: string): Promise<TextAnalysisResult> {
  console.log('🔍 Analyzing text (dummy):', text.substring(0, 50) + '...');
  
  // 基本的なキーワードチェックのみ実行
  const inappropriateKeywords = [
    '殺す', '死ね', '消えろ', 'うざい', 'きもい', 'きしょい',
    'ばか', 'あほ', 'まぬけ', 'のろま', 'くそ', 'ちくしょう',
    '売春', '風俗', '援交', '出会い系', 'アダルト',
    '薬物', 'ドラッグ', '覚醒剤', '大麻',
    '詐欺', 'だまし', '騙し', '金儲け', '儲け話'
  ];

  const detectedKeywords = inappropriateKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );

  const isAppropriate = detectedKeywords.length === 0;
  const reasons = detectedKeywords.length > 0 ? ['不適切なキーワードが含まれています'] : [];

  return {
    isAppropriate,
    sentiment: 'NEUTRAL',
    confidence: 0.5,
    reasons,
    piiDetected: false,
    piiEntities: []
  };
}

/**
 * プロフィール内容の適切性を判定（ダミー実装）
 */
export async function validateProfileContent(username: string, bio: string): Promise<{
  isValid: boolean;
  reasons: string[];
  analysisResult: TextAnalysisResult;
}> {
  console.log('🔍 Validating profile content (dummy)...');

  const fullText = `${username} ${bio}`;
  const analysisResult = await analyzeText(fullText);

  const reasons: string[] = [];

  // 分析結果に基づいて理由を追加
  if (!analysisResult.isAppropriate) {
    reasons.push(...analysisResult.reasons);
  }

  // ユーザー名の長さチェック
  if (username.length < 2) {
    reasons.push('ユーザー名が短すぎます');
  }

  if (username.length > 20) {
    reasons.push('ユーザー名が長すぎます');
  }

  // 自己紹介文の長さチェック
  if (bio && bio.length > 500) {
    reasons.push('自己紹介文が長すぎます');
  }

  const isValid = reasons.length === 0;

  return {
    isValid,
    reasons,
    analysisResult
  };
}

/**
 * チャットメッセージの適切性を判定（ダミー実装）
 */
export async function validateChatMessage(message: string): Promise<{
  isValid: boolean;
  reasons: string[];
  analysisResult: TextAnalysisResult;
}> {
  console.log('🔍 Validating chat message (dummy)...');

  const analysisResult = await analyzeText(message);

  const reasons: string[] = [];

  // 分析結果に基づいて理由を追加
  if (!analysisResult.isAppropriate) {
    reasons.push(...analysisResult.reasons);
  }

  // メッセージの長さチェック
  if (message.length > 1000) {
    reasons.push('メッセージが長すぎます');
  }

  const isValid = reasons.length === 0;

  return {
    isValid,
    reasons,
    analysisResult
  };
}
