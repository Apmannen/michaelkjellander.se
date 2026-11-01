import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  const secret = process.env.CMS_SITE_API_SECRET;
  const authorization = request.headers.get('authorization');

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => undefined);
  const tag = body?.tag;

  if (typeof tag !== 'string' || !tag) {
    return NextResponse.json({ error: 'Missing tag' }, { status: 400 });
  }

  revalidateTag(tag, 'max');

  return NextResponse.json({ revalidated: true, tag });
}
