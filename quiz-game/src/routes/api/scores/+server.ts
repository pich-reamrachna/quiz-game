import { db } from "$lib/server/db";
import { json } from '@sveltejs/kit'
import type { GameState } from "$lib/types";

export async function POST ({request}) {
  try {
    // send GameState data to server
    let body: GameState 
    try {
      body = await request.json();
      } catch {
        return json({ error: "Invalid JSON body" }, { status: 400 });
      }

    const { playerName, score} = body

    // check if playername exist, if its a string, and is between 1-12 character
    if (!playerName || typeof playerName !== 'string' || playerName.trim().length < 1 || playerName.trim().length > 12) {
      return json ({error: "Name must be between 1 and 12 characters."}, {status: 400})
    }

    // check if score is an integer, and positive number
    if (!Number.isInteger(score) || score <  0) {
      return json({error: 'Score must be a zero or a positive integer'}, {status: 400})
    }

    // insert into DB
    await db.execute({
      sql: 'INSERT INTO scores (name, score, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      args: [playerName.trim(), score]
    })

    // return success
    return json({message: 'Score saved!'}, {status:201} )
  
  // catch error
  } catch(error) {
      console.error(error)
      return json({error: 'Failed to save score!'}, {status:500})
  }
}

export async function GET ({url}) {
  try {

    // example: /api/scores?limit=10
    const limitParam = url.searchParams.get('limit');

    // limit parameter, and if not specified, default to 10
    let limit = limitParam ? parseInt(limitParam) : 10;
    
    // if limit is below 1, use default of 10
    if (isNaN(limit) || limit < 1) limit = 10;

    // limit to 100 max
    if (limit > 100) limit = 100;

    // query for ranking
    const result = await db.execute({
      sql: 'SELECT * FROM scores ORDER BY score DESC, created_at ASC LIMIT ?',
      args: [limit]
    });

    // return rows
    return json(result.rows)

  } catch (error) {
    console.error(error)
    return json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
