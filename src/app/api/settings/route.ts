import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// GET — fetch all settings as a key-value map
export async function GET() {
    try {
        const rows = await db.select().from(schema.settings);
        const map: Record<string, string> = {};
        for (const row of rows) {
            map[row.key] = row.value;
        }
        return NextResponse.json(map);
    } catch {
        return NextResponse.json({}, { status: 200 }); // graceful fallback
    }
}

// PUT — upsert a setting
export async function PUT(req: NextRequest) {
    try {
        const { key, value } = await req.json();
        if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

        // Check if key exists
        const [existing] = await db.select().from(schema.settings)
            .where(eq(schema.settings.key, key));

        if (existing) {
            await db.update(schema.settings)
                .set({ value: value ?? '' })
                .where(eq(schema.settings.key, key));
        } else {
            await db.insert(schema.settings).values({
                id: uuidv4(),
                key,
                value: value ?? '',
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Settings PUT error:', error);
        return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
    }
}
