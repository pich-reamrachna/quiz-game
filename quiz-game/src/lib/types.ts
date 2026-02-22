// ===============================
// Quiz Choice
// ===============================

export type ChoiceKey = "A" | "B" | "C" ;

export type Choice = {
    key: ChoiceKey;           // A, B, C
    text: string;             // Japanese text
    isCorrect: boolean;       // True for correct answer
};


// ===============================
// Quiz Question
// ===============================

export type Question = {
    id: string;               // unique id
    promptEn: string;         // English question
    choices: Choice[];        // 3 choices
};


// ===============================
// Game Status
// ===============================

export type GameStatus = "idle" | "playing" | "finished";


// ===============================
// Game State (Engine State)
// ===============================

export type GameState = {
    status: GameStatus;
    playerName: string;
    score: number;
    questionCount: number;
    currentQuestion: Question | null;
    remainingMs: number;
};


// ===============================
// Leaderboard Row (DB Result)
// ===============================

export type ScoreRow = {
    id: number;
    name: string;
    score: number;
    created_at: string;
};