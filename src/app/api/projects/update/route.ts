import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: 'Missing project id' }, { status: 400 });

        await db.update(schema.projects)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(eq(schema.projects.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }
}
