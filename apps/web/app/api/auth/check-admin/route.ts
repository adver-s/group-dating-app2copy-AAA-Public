import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../middleware/adminAuth';

async function handler(req: any) {
  try {
    const adminUser = req.adminUser;
    
    return NextResponse.json({
      success: true,
      adminUser: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { error: 'Admin authentication failed' },
      { status: 401 }
    );
  }
}

export const GET = withAdminAuth(handler);
