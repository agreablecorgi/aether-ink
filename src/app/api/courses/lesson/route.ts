import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callLLM(apiKey: string, model: string, messages: Array<{ role: string; content: string }>, temperature = 0.7, maxTokens = 4000) {
    let res;
    try {
        res = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Aether Ink - Teacher Mode',
            },
            body: JSON.stringify({
                model: model || 'google/gemini-2.0-flash-001',
                messages,
                temperature,
                max_tokens: maxTokens,
            }),
        });
    } catch (fetchErr) {
        throw new Error(`Network error calling LLM: ${fetchErr instanceof Error ? fetchErr.message : fetchErr}`);
    }

    if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        throw new Error(`LLM API error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

// POST — Generate lesson content or grade a submission
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, lessonId, courseId, apiKey, model, submissionContent } = body;

        if (!apiKey) {
            return NextResponse.json({ error: 'API key required' }, { status: 400 });
        }

        if (action === 'generate') {
            // Generate lesson content
            const [lesson] = await db.select().from(schema.lessons)
                .where(eq(schema.lessons.id, lessonId));

            if (!lesson) {
                return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
            }

            // If already has content, return it
            if (lesson.content && lesson.content.length > 50) {
                return NextResponse.json({ lesson });
            }

            const [course] = await db.select().from(schema.courses)
                .where(eq(schema.courses.id, lesson.courseId));

            if (!course) {
                return NextResponse.json({ error: 'Course not found' }, { status: 404 });
            }

            // Get previous lessons for context
            const previousLessons = await db.select().from(schema.lessons)
                .where(eq(schema.lessons.courseId, course.id))
                .orderBy(schema.lessons.lessonNumber);

            const completedTitles = previousLessons
                .filter(l => l.status === 'completed' && l.lessonNumber < lesson.lessonNumber)
                .map(l => `Lesson ${l.lessonNumber}: ${l.title}`)
                .join('\n');

            const systemPrompt = `You are Professor Aether, a brilliant, warm, and exacting creative writing instructor. You teach in ${course.language}. Your teaching style is:
- Encouraging but honest — never sugarcoat feedback
- Rich with examples from world literature  
- You adapt explanations to the student's level (${course.level})
- You use vivid examples and counterexamples
- ALL your output (explanations, examples, exercises) must be in ${course.language}

You are generating Lesson ${lesson.lessonNumber} of ${course.totalLessons}: "${lesson.title}"
Course level: ${course.level}
${completedTitles ? `\nPrevious lessons completed:\n${completedTitles}` : ''}

Generate a complete lesson with the following structure (in ${course.language}):

1. **LESSON TITLE & OBJECTIVE** — A clear one-sentence goal
2. **INTRODUCTION** (2-3 paragraphs) — Why this skill matters, with a compelling example
3. **CORE CONCEPTS** — 3-5 key principles with examples from literature  
4. **TECHNIQUE BREAKDOWN** — Step-by-step explanation with before/after examples
5. **COMMON MISTAKES** — 2-3 pitfalls to avoid
6. **EXERCISE** — A specific, creative writing exercise (200-500 words expected). Make it engaging and specific — not generic. Include clear requirements and constraints.

Format everything in clean Markdown. The exercise should be clearly wrapped in a section labeled "## ✍️ Exercise" so it can be parsed separately.`;

            const result = await callLLM(apiKey, model, [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate the full lesson for: "${lesson.title}"` },
            ], 0.75, 4000);

            // Extract exercise prompt from the generated content
            const exerciseMatch = result.match(/## ✍️ Exercise([\s\S]*?)(?=##|$)/i)
                || result.match(/## Exercise([\s\S]*?)(?=##|$)/i);
            const exercisePrompt = exerciseMatch ? exerciseMatch[1].trim() : '';

            // Update lesson with generated content
            await db.update(schema.lessons)
                .set({
                    content: result,
                    exercisePrompt,
                    objective: result.match(/objective[:\s]*(.+)/i)?.[1]?.trim() || '',
                    status: 'available',
                })
                .where(eq(schema.lessons.id, lessonId));

            const [updatedLesson] = await db.select().from(schema.lessons)
                .where(eq(schema.lessons.id, lessonId));

            return NextResponse.json({ lesson: updatedLesson });
        }

        if (action === 'grade') {
            // Grade a submission
            if (!submissionContent || !lessonId || !courseId) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }

            const [lesson] = await db.select().from(schema.lessons)
                .where(eq(schema.lessons.id, lessonId));

            const [course] = await db.select().from(schema.courses)
                .where(eq(schema.courses.id, courseId));

            if (!lesson || !course) {
                return NextResponse.json({ error: 'Lesson or course not found' }, { status: 404 });
            }

            const gradingPrompt = `You are Professor Aether, grading a student's creative writing exercise.

Course: ${course.title} (${course.level} level)
Language: ${course.language}
Lesson: ${lesson.title}

The exercise was:
${lesson.exercisePrompt}

The student submitted:
${submissionContent}

Grade this fairly and honestly. Respond with ONLY a JSON object (no markdown, no backticks):
{
  "grade": <number 0-100>,
  "feedback": "<2-3 paragraphs of constructive feedback in ${course.language}>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area 1>", "<area 2>", "<area 3>"],
  "letterGrade": "<A+/A/A-/B+/B/B-/C+/C/C-/D/F>"
}

Grading rubric:
- 90-100 (A): Exceptional — demonstrates mastery of the lesson's concepts with originality
- 80-89 (B): Strong — solid understanding with minor areas for growth
- 70-79 (C): Adequate — grasps basics but needs more practice
- 60-69 (D): Below expectations — significant gaps in understanding
- Below 60 (F): Needs fundamental review — did not address the exercise

Be FAIR and HONEST. Do not inflate grades. A beginner who writes a basic but correct piece deserves a B, not an A. Reserve A grades for genuinely impressive work at the student's level.`;

            const result = await callLLM(apiKey, model, [
                { role: 'system', content: gradingPrompt },
                { role: 'user', content: 'Grade this submission.' },
            ], 0.3, 2000);

            // Parse the grading result
            let gradeData;
            try {
                // Clean potential markdown wrapping
                const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                gradeData = JSON.parse(cleaned);
            } catch {
                gradeData = {
                    grade: 70,
                    feedback: result,
                    strengths: ['Submitted work'],
                    improvements: ['Could not parse structured feedback'],
                    letterGrade: 'C',
                };
            }

            // Save submission
            const submissionId = uuidv4();
            await db.insert(schema.submissions).values({
                id: submissionId,
                lessonId,
                courseId,
                content: submissionContent,
                grade: gradeData.grade,
                feedback: gradeData.feedback,
                strengths: JSON.stringify(gradeData.strengths || []),
                improvements: JSON.stringify(gradeData.improvements || []),
                status: 'graded',
                createdAt: new Date(),
            });

            // Mark lesson as completed
            await db.update(schema.lessons)
                .set({ status: 'completed' })
                .where(eq(schema.lessons.id, lessonId));

            // Unlock next lesson
            const nextLessonNumber = lesson.lessonNumber + 1;
            const [nextLesson] = await db.select().from(schema.lessons)
                .where(and(
                    eq(schema.lessons.courseId, courseId),
                    eq(schema.lessons.lessonNumber, nextLessonNumber)
                ));

            if (nextLesson) {
                await db.update(schema.lessons)
                    .set({ status: 'available' })
                    .where(eq(schema.lessons.id, nextLesson.id));
            }

            // Update course progress
            const allSubmissions = await db.select().from(schema.submissions)
                .where(eq(schema.submissions.courseId, courseId));

            const totalGrades = allSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
            const avgGrade = Math.round(totalGrades / allSubmissions.length);
            const completedCount = allSubmissions.length;

            await db.update(schema.courses)
                .set({
                    completedLessons: completedCount,
                    currentLesson: Math.min(nextLessonNumber, course.totalLessons),
                    averageGrade: avgGrade,
                    status: completedCount >= course.totalLessons ? 'completed' : 'active',
                    updatedAt: new Date(),
                })
                .where(eq(schema.courses.id, courseId));

            return NextResponse.json({
                submission: {
                    id: submissionId,
                    ...gradeData,
                },
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to process request';
        console.error('Lesson API error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
