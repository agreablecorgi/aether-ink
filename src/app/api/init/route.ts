import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export async function POST() {
  try {
    const DATA_DIR = path.join(process.cwd(), '.aether-data');

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const dbPath = path.join(DATA_DIR, 'aether-ink.db');
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT 'Untitled Project',
        description TEXT DEFAULT '',
        mode TEXT NOT NULL DEFAULT 'story',
        mood TEXT DEFAULT 'neutral',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT 'Untitled Chapter',
        content TEXT DEFAULT '',
        "order" INTEGER NOT NULL DEFAULT 0,
        word_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS snapshots (
        id TEXT PRIMARY KEY,
        chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        label TEXT DEFAULT '',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        language TEXT NOT NULL DEFAULT 'English',
        level TEXT NOT NULL DEFAULT 'beginner',
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        current_lesson INTEGER NOT NULL DEFAULT 0,
        total_lessons INTEGER NOT NULL DEFAULT 12,
        completed_lessons INTEGER NOT NULL DEFAULT 0,
        average_grade INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        lesson_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        objective TEXT DEFAULT '',
        content TEXT NOT NULL,
        exercise_prompt TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'locked',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        grade INTEGER,
        feedback TEXT DEFAULT '',
        strengths TEXT DEFAULT '',
        improvements TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'submitted',
        created_at INTEGER NOT NULL
      );
    `);

    sqlite.close();

    return NextResponse.json({ success: true, path: dbPath });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
