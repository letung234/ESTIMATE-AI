import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    await request.json();
  } catch {
    // Ignore payload parsing errors for this debug endpoint.
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
