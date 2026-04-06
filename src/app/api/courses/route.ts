import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const COURSE_CURRICULA: Record<string, Record<string, string[]>> = {
    English: {
        beginner: [
            'The Power of Observation — Descriptive Writing',
            'Finding Your Voice — Narrative Perspective',
            'Show, Don\'t Tell — Sensory Details',
            'Dialogue that Breathes — Writing Conversation',
            'Building Blocks — Paragraph Structure',
            'The Hook — Opening Lines that Grip',
            'Character Sketches — Bringing People to Life',
            'Setting the Scene — World Building Basics',
            'Conflict & Tension — The Engine of Story',
            'Pacing & Rhythm — Controlling Flow',
            'Revision as Discovery — Editing Your Work',
            'Your First Short Story — Putting It All Together',
        ],
        intermediate: [
            'Subtext & Implication — What\'s Left Unsaid',
            'Unreliable Narrators — Playing with Truth',
            'Metaphor & Symbolism — Layered Meaning',
            'Flashbacks & Time — Non-linear Narrative',
            'Interior Monologue — Stream of Consciousness',
            'The Anti-hero — Complex Characterization',
            'Genre Blending — Breaking Boundaries',
            'Atmosphere & Mood — Emotional Landscape',
            'Plot Twists — Subverting Expectations',
            'Theme & Thesis — What Your Story Means',
            'Workshop: Peer Review Simulation',
            'Your Intermediate Story — A Complete Work',
        ],
        advanced: [
            'Experimental Forms — Breaking Convention',
            'Metafiction — The Self-Aware Story',
            'Polyphonic Narrative — Multiple Voices',
            'Magical Realism — The Extraordinary Ordinary',
            'Flash Fiction — Maximum Impact, Minimum Words',
            'Epistolary & Found Document — Alternative Formats',
            'Prose Poetry — The Borderland',
            'The Novella — Extended Narrative Form',
            'Cultural Voice — Writing from Heritage',
            'The Revision Masterclass — Deep Editing',
            'Building a Portfolio — The Professional Writer',
            'The Capstone — Your Signature Piece',
        ],
    },
};

// Helper: Generate curriculum for non-English languages
function getCurriculum(language: string, level: string): string[] {
    if (COURSE_CURRICULA[language]?.[level]) {
        return COURSE_CURRICULA[language][level];
    }
    // For other languages, use English titles as base (LLM will generate content in target language)
    return COURSE_CURRICULA['English'][level] || COURSE_CURRICULA['English']['beginner'];
}

// GET — Fetch all courses, or a specific course with lessons
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');

        if (courseId) {
            const [course] = await db.select().from(schema.courses)
                .where(eq(schema.courses.id, courseId));

            if (!course) {
                return NextResponse.json({ error: 'Course not found' }, { status: 404 });
            }

            const courseLessons = await db.select().from(schema.lessons)
                .where(eq(schema.lessons.courseId, courseId))
                .orderBy(schema.lessons.lessonNumber);

            const courseSubmissions = await db.select().from(schema.submissions)
                .where(eq(schema.submissions.courseId, courseId));

            return NextResponse.json({ course, lessons: courseLessons, submissions: courseSubmissions });
        }

        const allCourses = await db.select().from(schema.courses)
            .orderBy(schema.courses.updatedAt);

        return NextResponse.json(allCourses);
    } catch (error) {
        console.error('Courses GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

// POST — Create a new course and generate lesson stubs
export async function POST(req: NextRequest) {
    try {
        const { language, level } = await req.json();
        const now = new Date();
        const courseId = uuidv4();
        const curriculum = getCurriculum(language, level);

        const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);
        const title = `${levelLabel} Creative Writing in ${language}`;
        const description = `A structured ${curriculum.length}-lesson course in creative writing, taught in ${language}. Covers fundamental through advanced techniques with hands-on exercises graded by your AI instructor.`;

        // Create the course
        await db.insert(schema.courses).values({
            id: courseId,
            language,
            level,
            title,
            description,
            currentLesson: 1,
            totalLessons: curriculum.length,
            completedLessons: 0,
            averageGrade: 0,
            status: 'active',
            createdAt: now,
            updatedAt: now,
        });

        // Create lesson stubs
        for (let i = 0; i < curriculum.length; i++) {
            await db.insert(schema.lessons).values({
                id: uuidv4(),
                courseId,
                lessonNumber: i + 1,
                title: curriculum[i],
                objective: '',
                content: '', // Will be generated on-demand by the LLM
                exercisePrompt: '',
                status: i === 0 ? 'available' : 'locked',
                createdAt: now,
            });
        }

        const [course] = await db.select().from(schema.courses)
            .where(eq(schema.courses.id, courseId));

        return NextResponse.json(course);
    } catch (error) {
        console.error('Course creation error:', error);
        return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }
}

// DELETE — Delete a course
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        await db.delete(schema.courses).where(eq(schema.courses.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Course delete error:', error);
        return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }
}
