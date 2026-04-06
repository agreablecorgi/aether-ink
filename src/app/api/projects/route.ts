import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const allProjects = await db.select().from(schema.projects).orderBy(schema.projects.updatedAt);
        return NextResponse.json(allProjects.reverse());
    } catch {
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const now = new Date();
        const project = {
            id: uuidv4(),
            title: body.title || 'Untitled Project',
            description: body.description || '',
            mode: body.mode || 'story',
            mood: 'neutral',
            createdAt: now,
            updatedAt: now,
        };

        await db.insert(schema.projects).values(project);

        // Create a default first chapter
        const chapter = {
            id: uuidv4(),
            projectId: project.id,
            title: 'Chapter 1',
            content: '',
            order: 0,
            wordCount: 0,
            createdAt: now,
            updatedAt: now,
        };
        await db.insert(schema.chapters).values(chapter);

        return NextResponse.json({ ...project, chapters: [chapter] }, { status: 201 });
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing project id' }, { status: 400 });

        await db.delete(schema.projects).where(eq(schema.projects.id, id));
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }
}
