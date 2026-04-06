import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

let _db: BetterSQLite3Database<typeof schema> | null = null;

function getDb() {
    if (_db) return _db;

    const DATA_DIR = path.join(process.cwd(), '.aether-data');

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const dbPath = path.join(DATA_DIR, 'aether-ink.db');
    const sqlite = new Database(dbPath);

    // Enable WAL mode for better concurrent read performance
    sqlite.pragma('journal_mode = WAL');

    _db = drizzle(sqlite, { schema });
    return _db;
}

// Export a proxy that lazily initializes
export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
    get(_target, prop) {
        const realDb = getDb();
        const value = (realDb as any)[prop];
        if (typeof value === 'function') {
            return value.bind(realDb);
        }
        return value;
    },
});

export { schema };
