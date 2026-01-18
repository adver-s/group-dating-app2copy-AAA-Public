import { NextRequest, NextResponse } from 'next/server';

const events = [
  {
    id: '1',
    title: '渋谷合コン',
    description: '渋谷で楽しい合コンしましょう！',
    date: '2024-06-15T19:00:00Z',
    location: '渋谷駅前カフェ',
    teams: ['1', '2'],
    status: 'confirmed'
  }
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = events.find(e => e.id === id);
  
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  
  return NextResponse.json(event);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const eventIndex = events.findIndex(e => e.id === id);
  
  if (eventIndex === -1) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  
  const body = await req.json();
  events[eventIndex] = { ...events[eventIndex], ...body };
  
  return NextResponse.json(events[eventIndex]);
} 