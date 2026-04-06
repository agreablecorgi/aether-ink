import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/lib/db/schema.ts',
    out: './.aether-data/migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: './.aether-data/aether-ink.db',
    },
});
