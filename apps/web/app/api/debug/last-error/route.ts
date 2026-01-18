import { NextResponse } from 'next/server';
import { getLastError } from '../../../../utils/lastError';

export async function GET() {
    const err = getLastError();
    return NextResponse.json({ lastError: err });
}


