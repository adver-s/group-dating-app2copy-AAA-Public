// Display utilities for converting numeric values to Japanese text

export const getGenderDisplay = (gender: number): string => {
  switch (gender) {
    case 0:
      return '女子';
    case 1:
      return '男子';
    default:
      return '未設定';
  }
};

export const getTeamGenderDisplay = (gender: number): string => {
  switch (gender) {
    case 0:
      return '女子のみ';
    case 1:
      return '男女混在';
    case 2:
      return '男子のみ';
    default:
      return '未設定';
  }
};

export const getTargetGenderDisplay = (targetGender: number): string => {
  switch (targetGender) {
    case 0:
      return '女子に表示';
    case 1:
      return '男女どちらにも表示';
    case 2:
      return '男子に表示';
    default:
      return '未設定';
  }
};

export const getSmokeDisplay = (smoke: number): string => {
  switch (smoke) {
    case 0:
      return '吸わない';
    case 1:
      return '吸う';
    default:
      return '未設定';
  }
};

export const getAlcoholDisplay = (alcohol: number): string => {
  switch (alcohol) {
    case 0:
      return '飲まない';
    case 1:
      return '一部飲まない';
    case 2:
      return '飲む';
    default:
      return '未設定';
  }
};

// Weekday display (0-6)
export const getWeekdayDisplay = (weekday: number): string => {
  switch (weekday) {
    case 0:
      return '月曜日';
    case 1:
      return '火曜日';
    case 2:
      return '水曜日';
    case 3:
      return '木曜日';
    case 4:
      return '金曜日';
    case 5:
      return '土曜日';
    case 6:
      return '日曜日';
    default:
      return '未設定';
  }
};

// Time slot display (0-2)
export const getTimeSlotDisplay = (timeSlot: number): string => {
  switch (timeSlot) {
    case 0:
      return '昼';
    case 1:
      return '夕方';
    case 2:
      return '夜';
    default:
      return '未設定';
  }
};

// Prefecture display (1-47)
export const getPrefectureDisplay = (prefectureCode: number): string => {
  const prefectures: { [key: number]: string } = {
    1: '北海道', 2: '青森県', 3: '岩手県', 4: '宮城県', 5: '秋田県',
    6: '山形県', 7: '福島県', 8: '茨城県', 9: '栃木県', 10: '群馬県',
    11: '埼玉県', 12: '千葉県', 13: '東京都', 14: '神奈川県', 15: '新潟県',
    16: '富山県', 17: '石川県', 18: '福井県', 19: '山梨県', 20: '長野県',
    21: '岐阜県', 22: '静岡県', 23: '愛知県', 24: '三重県', 25: '滋賀県',
    26: '京都府', 27: '大阪府', 28: '兵庫県', 29: '奈良県', 30: '和歌山県',
    31: '鳥取県', 32: '島根県', 33: '岡山県', 34: '広島県', 35: '山口県',
    36: '徳島県', 37: '香川県', 38: '愛媛県', 39: '高知県', 40: '福岡県',
    41: '佐賀県', 42: '長崎県', 43: '熊本県', 44: '大分県', 45: '宮崎県',
    46: '鹿児島県', 47: '沖縄県'
  };
  
  return prefectures[prefectureCode] || '未設定';
};

export const getGenderOptions = () => [
  { value: 0, label: '女子' },
  { value: 1, label: '男子' }
];

export const getTeamGenderOptions = () => [
  { value: 0, label: '女子のみ' },
  { value: 1, label: '男女混在' },
  { value: 2, label: '男子のみ' }
];

export const getTargetGenderOptions = () => [
  { value: 0, label: '女子に表示' },
  { value: 1, label: '男女どちらにも表示' },
  { value: 2, label: '男子に表示' }
];

export const getSmokeOptions = () => [
  { value: 0, label: '吸わない' },
  { value: 1, label: '吸う' }
];

export const getAlcoholOptions = () => [
  { value: 0, label: '飲まない' },
  { value: 1, label: '一部飲まない' },
  { value: 2, label: '飲む' }
];

// Weekday options (0-6)
export const getWeekdayOptions = () => [
  { value: 0, label: '月曜日' },
  { value: 1, label: '火曜日' },
  { value: 2, label: '水曜日' },
  { value: 3, label: '木曜日' },
  { value: 4, label: '金曜日' },
  { value: 5, label: '土曜日' },
  { value: 6, label: '日曜日' }
];

// Time slot options (0-2)
export const getTimeSlotOptions = () => [
  { value: 0, label: '昼' },
  { value: 1, label: '夕方' },
  { value: 2, label: '夜' }
];

// Weekday and time slot options (21 combinations)
export const getWeekdayTimeOptions = () => [
  { value: '0_0', label: '月曜日 昼' },
  { value: '0_1', label: '月曜日 夕方' },
  { value: '0_2', label: '月曜日 夜' },
  { value: '1_0', label: '火曜日 昼' },
  { value: '1_1', label: '火曜日 夕方' },
  { value: '1_2', label: '火曜日 夜' },
  { value: '2_0', label: '水曜日 昼' },
  { value: '2_1', label: '水曜日 夕方' },
  { value: '2_2', label: '水曜日 夜' },
  { value: '3_0', label: '木曜日 昼' },
  { value: '3_1', label: '木曜日 夕方' },
  { value: '3_2', label: '木曜日 夜' },
  { value: '4_0', label: '金曜日 昼' },
  { value: '4_1', label: '金曜日 夕方' },
  { value: '4_2', label: '金曜日 夜' },
  { value: '5_0', label: '土曜日 昼' },
  { value: '5_1', label: '土曜日 夕方' },
  { value: '5_2', label: '土曜日 夜' },
  { value: '6_0', label: '日曜日 昼' },
  { value: '6_1', label: '日曜日 夕方' },
  { value: '6_2', label: '日曜日 夜' }
];

// Helper function to get weekday and time slot from combined value
export const parseWeekdayTime = (value: string) => {
  const [weekday, timeSlot] = value.split('_').map(Number);
  return { weekday, timeSlot };
};

// Helper function to combine weekday and time slot
export const combineWeekdayTime = (weekday: number, timeSlot: number) => {
  return `${weekday}_${timeSlot}`;
};

// Hobby options (to be defined by you)
export const getHobbyOptions = () => [
  // スポーツ系
  { value: 'sports', label: 'スポーツ' },
  { value: 'fitness', label: 'フィットネス' },
  { value: 'outdoor', label: 'アウトドア' },
  
  // グルメ系
  { value: 'cafe', label: 'カフェ巡り' },
  { value: 'restaurant', label: 'グルメ' },
  { value: 'cooking', label: '料理' },
  
  // エンターテイメント系
  { value: 'movie', label: '映画' },
  { value: 'music', label: '音楽' },
  { value: 'karaoke', label: 'カラオケ' },
  { value: 'gaming', label: 'ゲーム' },
  
  // アート・文化系
  { value: 'art', label: 'アート' },
  { value: 'photography', label: '写真' },
  { value: 'reading', label: '読書' },
  
  // その他
  { value: 'travel', label: '旅行' },
  { value: 'shopping', label: 'ショッピング' },
  { value: 'dancing', label: 'ダンス' }
];

// Prefecture options (Japan's 47 prefectures)
export const getPrefectureOptions = () => [
  { value: 1, label: '北海道' },
  { value: 2, label: '青森県' },
  { value: 3, label: '岩手県' },
  { value: 4, label: '宮城県' },
  { value: 5, label: '秋田県' },
  { value: 6, label: '山形県' },
  { value: 7, label: '福島県' },
  { value: 8, label: '茨城県' },
  { value: 9, label: '栃木県' },
  { value: 10, label: '群馬県' },
  { value: 11, label: '埼玉県' },
  { value: 12, label: '千葉県' },
  { value: 13, label: '東京都' },
  { value: 14, label: '神奈川県' },
  { value: 15, label: '新潟県' },
  { value: 16, label: '富山県' },
  { value: 17, label: '石川県' },
  { value: 18, label: '福井県' },
  { value: 19, label: '山梨県' },
  { value: 20, label: '長野県' },
  { value: 21, label: '岐阜県' },
  { value: 22, label: '静岡県' },
  { value: 23, label: '愛知県' },
  { value: 24, label: '三重県' },
  { value: 25, label: '滋賀県' },
  { value: 26, label: '京都府' },
  { value: 27, label: '大阪府' },
  { value: 28, label: '兵庫県' },
  { value: 29, label: '奈良県' },
  { value: 30, label: '和歌山県' },
  { value: 31, label: '鳥取県' },
  { value: 32, label: '島根県' },
  { value: 33, label: '岡山県' },
  { value: 34, label: '広島県' },
  { value: 35, label: '山口県' },
  { value: 36, label: '徳島県' },
  { value: 37, label: '香川県' },
  { value: 38, label: '愛媛県' },
  { value: 39, label: '高知県' },
  { value: 40, label: '福岡県' },
  { value: 41, label: '佐賀県' },
  { value: 42, label: '長崎県' },
  { value: 43, label: '熊本県' },
  { value: 44, label: '大分県' },
  { value: 45, label: '宮崎県' },
  { value: 46, label: '鹿児島県' },
  { value: 47, label: '沖縄県' }
];

// Helper function to get hobby display
export const getHobbyDisplay = (hobby: string): string => {
  const options = getHobbyOptions();
  const option = options.find(opt => opt.value === hobby);
  return option ? option.label : hobby;
};

// Helper function to get label by value for different types
export const getLabelByValue = (type: 'weekday' | 'time_slot' | 'hobby' | 'prefecture', value: string | number): string => {
  let options;
  
  switch (type) {
    case 'weekday':
      return getWeekdayDisplay(Number(value));
    case 'time_slot':
      return getTimeSlotDisplay(Number(value));
    case 'hobby':
      return getHobbyDisplay(String(value));
    case 'prefecture':
      return getPrefectureDisplay(Number(value));
    default:
      return String(value);
  }
}; 

// マッチングフローのステータス表示
export const getMatchingFlowStatusText = (status: number): string => {
  switch (status) {
    case 0:
      return 'アリにスワイプ済み（グループ内判定）';
    case 1:
      return 'グループ全員アリ（相手判定）';
    case 2:
      return '相手全員OK（トーク段階）';
    case 3:
      return '正式マッチング';
    default:
      return '不明';
  }
};

// メンバー判定のステータス表示
export const getJudgementStatusText = (status: number): string => {
  switch (status) {
    case 0:
      return '未判定';
    case 1:
      return 'アリ';
    case 2:
      return 'パス';
    case 3:
      return '非表示';
    case 4:
      return 'ブロック';
    case 5:
      return 'エターナル';
    default:
      return '不明';
  }
};

// メンバー判定のステータス色
export const getJudgementStatusColor = (status: number): string => {
  switch (status) {
    case 0:
      return 'text-gray-500'; // 未判定
    case 1:
      return 'text-green-600'; // アリ
    case 2:
      return 'text-red-600'; // パス
    case 3:
      return 'text-yellow-600'; // 非表示
    case 4:
      return 'text-red-800'; // ブロック
    case 5:
      return 'text-purple-600'; // エターナル
    default:
      return 'text-gray-400';
  }
};

// マッチングフローのステータス色
export const getMatchingFlowStatusColor = (status: number): string => {
  switch (status) {
    case 0:
      return 'text-blue-600'; // アリにスワイプ済み
    case 1:
      return 'text-orange-600'; // グループ全員アリ
    case 2:
      return 'text-green-600'; // 相手全員OK
    case 3:
      return 'text-purple-600'; // 正式マッチング
    default:
      return 'text-gray-400';
  }
};

// 非表示期間の表示
export const getHiddenUntilText = (hiddenUntil: string | null): string => {
  if (!hiddenUntil) return 'なし';
  
  const hiddenDate = new Date(hiddenUntil);
  const now = new Date();
  
  if (hiddenDate <= now) {
    return '復活済み';
  }
  
  const diffMs = hiddenDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return `${diffDays}日後に復活`;
};

// 判定の詳細説明
export const getJudgementDescription = (status: number, hiddenUntil?: string | null): string => {
  switch (status) {
    case 0:
      return 'まだ判定していません';
    case 1:
      return 'このグループにアリを出しました';
    case 2:
      return 'このグループをパスしました';
    case 3:
      return `非表示にしました${hiddenUntil ? `（${getHiddenUntilText(hiddenUntil)}）` : ''}`;
    case 4:
      return 'このグループをブロックしました';
    case 5:
      return '一度合コンした相手です（エターナル）';
    default:
      return '不明な状態です';
  }
}; 