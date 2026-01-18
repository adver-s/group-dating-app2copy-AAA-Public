import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    // 現在のDB構造ではeventsテーブルが存在しないため、
    // ダミーデータを返す
    const dummyEvents = [
  {
    id: '1',
    title: '渋谷合コン',
    description: '渋谷で楽しい合コンしましょう！',
    date: '2024-06-15T19:00:00Z',
    location: '渋谷駅前カフェ',
    teams: ['1', '2'],
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        title: '新宿飲み会',
        description: '新宿で楽しい飲み会しましょう！',
        date: '2024-06-20T20:00:00Z',
        location: '新宿居酒屋',
        teams: ['3', '4'],
        status: 'proposed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
  }
];
    
    return NextResponse.json(dummyEvents);
  } catch (error) {
    console.error('イベント取得エラー:', error);
    return NextResponse.json(
      { error: 'イベント取得エラー' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, date, location, teams } = body;
    
    if (!title || !date || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 現在のDB構造ではeventsテーブルが存在しないため、
    // ダミーレスポンスを返す
    const newEvent = {
      id: String(Math.floor(Math.random() * 1000)),
      title,
      description,
      date,
      location,
      teams: teams || [],
      status: 'proposed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('イベント作成エラー:', error);
    return NextResponse.json(
      { error: 'イベント作成エラー' },
      { status: 500 }
    );
  }
} 