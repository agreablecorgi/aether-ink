import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        const format = searchParams.get('format') || 'markdown';

        if (!projectId) {
            return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
        }

        // Fetch project
        const [project] = await db.select().from(schema.projects)
            .where(eq(schema.projects.id, projectId));

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Fetch chapters
        const chapters = await db.select().from(schema.chapters)
            .where(eq(schema.chapters.projectId, projectId))
            .orderBy(schema.chapters.order);

        if (format === 'json') {
            return NextResponse.json({
                project: {
                    title: project.title,
                    description: project.description,
                    mode: project.mode,
                    mood: project.mood,
                    createdAt: project.createdAt,
                    updatedAt: project.updatedAt,
                },
                chapters: chapters.map(ch => ({
                    title: ch.title,
                    content: ch.content,
                    order: ch.order,
                    wordCount: ch.wordCount,
                })),
            });
        }

        // Default: Markdown export
        let markdown = `# ${project.title}\n\n`;

        if (project.description) {
            markdown += `> ${project.description}\n\n`;
        }

        markdown += `---\n\n`;

        for (const chapter of chapters) {
            markdown += `## ${chapter.title}\n\n`;

            // Strip HTML tags, preserve paragraphs
            const plainText = (chapter.content || '')
                .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
                .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
                .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
                .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
                .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
                .replace(/<em>(.*?)<\/em>/gi, '*$1*')
                .replace(/<u>(.*?)<\/u>/gi, '$1')
                .replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<[^>]*>/g, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            markdown += plainText + '\n\n';
            markdown += `---\n\n`;
        }

        // Return as downloadable file
        const headers = new Headers();
        const safeTitle = project.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
        headers.set('Content-Type', 'text/markdown; charset=utf-8');
        headers.set('Content-Disposition', `attachment; filename="${safeTitle}.md"`);

        return new NextResponse(markdown, { headers });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Failed to export project' }, { status: 500 });
    }
}
