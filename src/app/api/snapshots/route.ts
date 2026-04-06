import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const chapterId = searchParams.get('chapterId');
        if (!chapterId) return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 });

        const snaps = await db.select().from(schema.snapshots)
            .where(eq(schema.snapshots.chapterId, chapterId))
            .orderBy(schema.snapshots.createdAt);

        return NextResponse.json(snaps.reverse());
    } catch {
        return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const snap = {
            id: uuidv4(),
            chapterId: body.chapterId,
            content: body.content,
            label: body.label || `Snapshot ${new Date().toLocaleString()}`,
            createdAt: new Date(),
        };

        await db.insert(schema.snapshots).values(snap);
        return NextResponse.json(snap, { status: 201 });
    } catch (error) {
        console.error('Error creating snapshot:', error);
        return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
    }
}
