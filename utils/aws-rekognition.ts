import { RekognitionClient, DetectModerationLabelsCommand, DetectLabelsCommand } from '@aws-sdk/client-rekognition';

// AWS Rekognition クライアントの初期化
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  labels: string[];
  reasons: string[];
}

export interface LabelResult {
  labels: string[];
  confidence: number;
}

/**
 * 画像の不適切コンテンツを検出
 */
export async function detectInappropriateContent(imageBuffer: Buffer): Promise<ModerationResult> {
  try {
    console.log('🔍 Detecting inappropriate content in image...');

    const command = new DetectModerationLabelsCommand({
      Image: {
        Bytes: imageBuffer
      },
      MinConfidence: 50.0 // 50%以上の信頼度で検出
    });

    const response = await rekognitionClient.send(command);
    
    const moderationLabels = response.ModerationLabels || [];
    const isAppropriate = moderationLabels.length === 0;
    
    const labels = moderationLabels.map(label => label.Name || '').filter(Boolean);
    const reasons = moderationLabels.map(label => label.Name || '').filter(Boolean);
    
    const confidence = moderationLabels.length > 0 
      ? Math.max(...moderationLabels.map(label => label.Confidence || 0))
      : 100;

    console.log('✅ Moderation detection completed:', {
      isAppropriate,
      confidence,
      labels,
      reasons
    });

    return {
      isAppropriate,
      confidence,
      labels,
      reasons
    };

  } catch (error) {
    console.error('❌ Moderation detection error:', error);
    // エラーの場合は安全側に倒して不適切と判定
    return {
      isAppropriate: false,
      confidence: 0,
      labels: ['error'],
      reasons: ['検出エラー']
    };
  }
}

/**
 * 画像のラベルを検出（人物、物体など）
 */
export async function detectImageLabels(imageBuffer: Buffer): Promise<LabelResult> {
  try {
    console.log('🔍 Detecting image labels...');

    const command = new DetectLabelsCommand({
      Image: {
        Bytes: imageBuffer
      },
      MaxLabels: 10,
      MinConfidence: 70.0
    });

    const response = await rekognitionClient.send(command);
    
    const labels = response.Labels?.map(label => label.Name || '').filter(Boolean) || [];
    const confidence = response.Labels && response.Labels.length > 0 
      ? Math.max(...response.Labels.map(label => label.Confidence || 0))
      : 0;

    console.log('✅ Label detection completed:', { labels, confidence });

    return {
      labels,
      confidence
    };

  } catch (error) {
    console.error('❌ Label detection error:', error);
    return {
      labels: [],
      confidence: 0
    };
  }
}

/**
 * プロフィール写真の適切性を判定
 */
export async function validateProfilePhoto(imageBuffer: Buffer): Promise<{
  isValid: boolean;
  reasons: string[];
  moderationResult: ModerationResult;
  labelResult: LabelResult;
}> {
  try {
    console.log('🔍 Validating profile photo...');

    // 不適切コンテンツを検出
    const moderationResult = await detectInappropriateContent(imageBuffer);
    
    // ラベルを検出
    const labelResult = await detectImageLabels(imageBuffer);

    const reasons: string[] = [];

    // 不適切コンテンツがある場合
    if (!moderationResult.isAppropriate) {
      reasons.push('不適切なコンテンツが検出されました');
      reasons.push(...moderationResult.reasons);
    }

    // 人物が検出されない場合
    const hasPerson = labelResult.labels.some(label => 
      label.toLowerCase().includes('person') || 
      label.toLowerCase().includes('people') ||
      label.toLowerCase().includes('human')
    );

    if (!hasPerson) {
      reasons.push('人物が検出されませんでした');
    }

    const isValid = reasons.length === 0;

    console.log('✅ Profile photo validation completed:', {
      isValid,
      reasons,
      moderationResult,
      labelResult
    });

    return {
      isValid,
      reasons,
      moderationResult,
      labelResult
    };

  } catch (error) {
    console.error('❌ Profile photo validation error:', error);
    return {
      isValid: false,
      reasons: ['検証エラーが発生しました'],
      moderationResult: {
        isAppropriate: false,
        confidence: 0,
        labels: ['error'],
        reasons: ['検証エラー']
      },
      labelResult: {
        labels: [],
        confidence: 0
      }
    };
  }
}

/**
 * 本人確認書類の適切性を判定
 */
export async function validateIdentityDocument(imageBuffer: Buffer): Promise<{
  isValid: boolean;
  reasons: string[];
  documentType?: string;
}> {
  try {
    console.log('🔍 Validating identity document...');

    // ラベルを検出
    const labelResult = await detectImageLabels(imageBuffer);
    
    // 不適切コンテンツを検出
    const moderationResult = await detectInappropriateContent(imageBuffer);

    const reasons: string[] = [];

    // 不適切コンテンツがある場合
    if (!moderationResult.isAppropriate) {
      reasons.push('不適切なコンテンツが検出されました');
    }

    // 書類らしい要素が検出されるかチェック
    const documentKeywords = [
      'text', 'document', 'card', 'paper', 'rectangle', 'square'
    ];

    const hasDocumentElements = labelResult.labels.some(label =>
      documentKeywords.some(keyword => 
        label.toLowerCase().includes(keyword)
      )
    );

    if (!hasDocumentElements) {
      reasons.push('書類らしい要素が検出されませんでした');
    }

    // 書類タイプの推定
    let documentType = 'unknown';
    const labels = labelResult.labels.map(label => label.toLowerCase());
    
    if (labels.some(label => label.includes('license') || label.includes('card'))) {
      documentType = 'drivers_license';
    } else if (labels.some(label => label.includes('passport'))) {
      documentType = 'passport';
    } else if (labels.some(label => label.includes('card'))) {
      documentType = 'my_number';
    }

    const isValid = reasons.length === 0;

    console.log('✅ Identity document validation completed:', {
      isValid,
      reasons,
      documentType
    });

    return {
      isValid,
      reasons,
      documentType
    };

  } catch (error) {
    console.error('❌ Identity document validation error:', error);
    return {
      isValid: false,
      reasons: ['検証エラーが発生しました']
    };
  }
}
