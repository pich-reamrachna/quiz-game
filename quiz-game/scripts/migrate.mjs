import { readFile } from 'node:fs/promises';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

const files = [
  'migrations/001_create_scores.sql',
  'migrations/002_create_game_sessions.sql'
];

function toStatements(sqlText) {
  const noBom = sqlText.replace(/^\uFEFF/, '');
  const noComments = noBom
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  return noComments
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

for (const file of files) {
  const raw = await readFile(file, 'utf8');
  const statements = toStatements(raw);

  console.log(`\nApplying ${file} (${statements.length} statements)`);
  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    try {
      await db.execute(sql);
      console.log(`  OK ${i + 1}/${statements.length}`);
    } catch (err) {
      console.error(`  FAIL ${i + 1}/${statements.length}`);
      console.error(sql);
      throw err;
    }
  }
}

console.log('\nMigrations done.');
