import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        const chapterId = searchParams.get('id');

        if (chapterId) {
            const chapter = await db.select().from(schema.chapters).where(eq(schema.chapters.id, chapterId));
            if (!chapter.length) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
            return NextResponse.json(chapter[0]);
        }

        if (projectId) {
            const chapters = await db.select().from(schema.chapters)
                .where(eq(schema.chapters.projectId, projectId))
                .orderBy(schema.chapters.order);
            return NextResponse.json(chapters);
        }

        return NextResponse.json({ error: 'Missing projectId or id' }, { status: 400 });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const now = new Date();

        // Get max order for this project
        const existing = await db.select().from(schema.chapters)
            .where(eq(schema.chapters.projectId, body.projectId))
            .orderBy(schema.chapters.order);

        const maxOrder = existing.length > 0 ? Math.max(...existing.map(c => c.order)) : -1;

        const chapter = {
            id: uuidv4(),
            projectId: body.projectId,
            title: body.title || `Chapter ${existing.length + 1}`,
            content: body.content || '',
            order: maxOrder + 1,
            wordCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        await db.insert(schema.chapters).values(chapter);
        return NextResponse.json(chapter, { status: 201 });
    } catch (error) {
        console.error('Error creating chapter:', error);
        return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: 'Missing chapter id' }, { status: 400 });

        const wordCount = updates.content
            ? updates.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length
            : undefined;

        await db.update(schema.chapters)
            .set({
                ...updates,
                ...(wordCount !== undefined ? { wordCount } : {}),
                updatedAt: new Date(),
            })
            .where(eq(schema.chapters.id, id));

        // Also update the project's updatedAt
        const chapter = await db.select().from(schema.chapters).where(eq(schema.chapters.id, id));
        if (chapter.length > 0) {
            await db.update(schema.projects)
                .set({ updatedAt: new Date() })
                .where(eq(schema.projects.id, chapter[0].projectId));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating chapter:', error);
        return NextResponse.json({ error: 'Failed to update chapter' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing chapter id' }, { status: 400 });
        await db.delete(schema.chapters).where(eq(schema.chapters.id, id));
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 });
    }
}
