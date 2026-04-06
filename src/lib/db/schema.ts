import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default('Untitled Project'),
  description: text('description').default(''),
  mode: text('mode').notNull().default('story'), // 'story' | 'script' | 'draft'
  mood: text('mood').default('neutral'), // detected mood for dynamic theming
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const chapters = sqliteTable('chapters', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('Untitled Chapter'),
  content: text('content').default(''), // HTML content from TipTap
  order: integer('order').notNull().default(0),
  wordCount: integer('word_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const snapshots = sqliteTable('snapshots', {
  id: text('id').primaryKey(),
  chapterId: text('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  label: text('label').default(''),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});

// ── Teacher Mode ──
export const courses = sqliteTable('courses', {
  id: text('id').primaryKey(),
  language: text('language').notNull().default('English'),
  level: text('level').notNull().default('beginner'), // beginner | intermediate | advanced
  title: text('title').notNull(),
  description: text('description').default(''),
  currentLesson: integer('current_lesson').notNull().default(0),
  totalLessons: integer('total_lessons').notNull().default(12),
  completedLessons: integer('completed_lessons').notNull().default(0),
  averageGrade: integer('average_grade').default(0), // 0–100
  status: text('status').notNull().default('active'), // active | completed | paused
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const lessons = sqliteTable('lessons', {
  id: text('id').primaryKey(),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  lessonNumber: integer('lesson_number').notNull(),
  title: text('title').notNull(),
  objective: text('objective').default(''),
  content: text('content').notNull(), // markdown lesson content from LLM
  exercisePrompt: text('exercise_prompt').default(''), // the writing exercise
  status: text('status').notNull().default('locked'), // locked | available | in_progress | completed
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  content: text('content').notNull(), // student's submitted writing
  grade: integer('grade'), // 0–100 or null if ungraded
  feedback: text('feedback').default(''), // LLM-generated feedback
  strengths: text('strengths').default(''), // JSON array of strengths
  improvements: text('improvements').default(''), // JSON array of areas to improve
  status: text('status').notNull().default('submitted'), // submitted | graded
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;
export type Snapshot = typeof snapshots.$inferSelect;
export type NewSnapshot = typeof snapshots.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
