import { db } from "$lib/server/db";
import { json } from '@sveltejs/kit';
import crypto from 'node:crypto';

export async function POST({ request }) {
  try {
    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return json({ error: 'Malformed JSON payload' }, { status: 400 });
    }
    const { playerName } = payload;

    if (!playerName || typeof playerName !== 'string' || playerName.trim().length < 1 || playerName.trim().length > 20) {
      return json({ error: "Name must be between 1 and 20 characters." }, { status: 400 });
    }

    const sessionId = crypto.randomUUID();
    const startedAt = Date.now();
    const expiresAt = startedAt + (60 * 1000); // 60 seconds session

    await db.execute({
      sql: `INSERT INTO game_sessions (id, player_name, score, current_question_index, started_at, expires_at, status) 
            VALUES (?, ?, 0, 0, ?, ?, 'active')`,
      args: [sessionId, playerName.trim(), startedAt, expiresAt]
    });

    return json({ sessionId });
  } catch (error) {
    console.error(error);
    return json({ error: 'Failed to start game session' }, { status: 500 });
  }
}
