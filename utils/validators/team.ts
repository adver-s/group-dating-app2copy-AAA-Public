import { TeamFormData, Availability } from '@/types'
import { ValidationError } from '@/utils/errors'

// チーム作成・更新時のバリデーション
export const validateTeamFormData = (data: TeamFormData): void => {
  // 必須フィールドのチェック
  if (!data.name || data.name.trim().length === 0) {
    throw new ValidationError('チーム名は必須です')
  }
  
  if (data.name.length > 50) {
    throw new ValidationError('チーム名は50文字以下で入力してください')
  }
  
  if (data.description && data.description.length > 500) {
    throw new ValidationError('チーム説明は500文字以下で入力してください')
  }
  
  // 性別のチェック
  if (data.gender < 1 || data.gender > 3) {
    throw new ValidationError('性別は1-3の範囲で入力してください')
  }
  
  if (data.targetGender < 1 || data.targetGender > 3) {
    throw new ValidationError('対象性別は1-3の範囲で入力してください')
  }
  
  // メンバー数のチェック
  if (data.maxMembers < 2 || data.maxMembers > 10) {
    throw new ValidationError('最大メンバー数は2-10の範囲で入力してください')
  }
  
  // 画像のチェック
  if (data.images && data.images.length > 5) {
    throw new ValidationError('画像は最大5枚までアップロードできます')
  }
  
  // 趣味のチェック
  if (data.hobbies && data.hobbies.length > 10) {
    throw new ValidationError('趣味は最大10個まで選択できます')
  }
  
  // 都道府県のチェック
  if (data.preferredPrefs && data.preferredPrefs.length > 5) {
    throw new ValidationError('希望都道府県は最大5個まで選択できます')
  }
  
  // 空き時間のチェック
  if (data.availabilities && data.availabilities.length > 7) {
    throw new ValidationError('空き時間は最大7個まで設定できます')
  }
  
  // 空き時間の詳細チェック
  if (data.availabilities) {
    data.availabilities.forEach((availability, index) => {
      validateAvailability(availability, index)
    })
  }
}

// 空き時間のバリデーション
export const validateAvailability = (availability: Availability, index: number): void => {
  if (availability.weekday < 1 || availability.weekday > 7) {
    throw new ValidationError(`空き時間${index + 1}の曜日は1-7の範囲で入力してください`)
  }
  
  const validTimeslots = ['morning', 'afternoon', 'evening', 'night']
  if (!validTimeslots.includes(availability.timeslot)) {
    throw new ValidationError(`空き時間${index + 1}の時間帯は有効な値を入力してください`)
  }
}

// チーム名のバリデーション
export const validateTeamName = (name: string): void => {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('チーム名は必須です')
  }
  
  if (name.length < 2) {
    throw new ValidationError('チーム名は2文字以上で入力してください')
  }
  
  if (name.length > 50) {
    throw new ValidationError('チーム名は50文字以下で入力してください')
  }
  
  // 禁止文字のチェック
  const forbiddenChars = /[<>:"/\\|?*]/
  if (forbiddenChars.test(name)) {
    throw new ValidationError('チーム名に使用できない文字が含まれています')
  }
}

// チーム説明のバリデーション
export const validateTeamDescription = (description: string): void => {
  if (description && description.length > 500) {
    throw new ValidationError('チーム説明は500文字以下で入力してください')
  }
}

// 画像のバリデーション
export const validateTeamImages = (images: string[]): void => {
  if (images.length > 5) {
    throw new ValidationError('画像は最大5枚までアップロードできます')
  }
  
  // Base64形式のチェック
  images.forEach((image, index) => {
    if (!image.startsWith('data:image/')) {
      throw new ValidationError(`画像${index + 1}の形式が正しくありません`)
    }
    
    // ファイルサイズのチェック（Base64の長さから推定）
    if (image.length > 10 * 1024 * 1024) { // 約10MB
      throw new ValidationError(`画像${index + 1}のファイルサイズが大きすぎます`)
    }
  })
}

// 趣味のバリデーション
export const validateHobbies = (hobbies: string[]): void => {
  if (hobbies.length > 10) {
    throw new ValidationError('趣味は最大10個まで選択できます')
  }
  
  hobbies.forEach((hobby, index) => {
    if (!hobby || hobby.trim().length === 0) {
      throw new ValidationError(`趣味${index + 1}は空にできません`)
    }
    
    if (hobby.length > 20) {
      throw new ValidationError(`趣味${index + 1}は20文字以下で入力してください`)
    }
  })
}

// 都道府県のバリデーション
export const validatePrefectures = (prefectures: string[]): void => {
  if (prefectures.length > 5) {
    throw new ValidationError('希望都道府県は最大5個まで選択できます')
  }
  
  const validPrefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ]
  
  prefectures.forEach((prefecture, index) => {
    if (!validPrefectures.includes(prefecture)) {
      throw new ValidationError(`都道府県${index + 1}は有効な値を選択してください`)
    }
  })
}