import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    secret?: string;
    path?: string;
    paths?: string[];
    tag?: string;
    tags?: string[];
  };

  if (payload.secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const paths = [payload.path, ...(payload.paths ?? [])].filter(Boolean) as string[];
  const tags = [payload.tag, ...(payload.tags ?? [])].filter(Boolean) as string[];

  if (paths.length === 0 && tags.length === 0) {
    revalidatePath('/');
    return NextResponse.json({ revalidated: true, paths: ['/'], tags: [] });
  }

  paths.forEach((path) => revalidatePath(path));
  tags.forEach((tag) => revalidateTag(tag, 'max'));

  return NextResponse.json({
    revalidated: true,
    paths,
    tags,
  });
}
