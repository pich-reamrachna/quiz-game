// ===============================
// Quiz Choice
// ===============================

export type ChoiceKey = 'A' | 'B' | 'C';

export type Choice = {
	key: ChoiceKey; // A, B, C
	text: string; // Japanese text
	isCorrect: boolean; // True for correct answer
};

// ===============================
// Quiz Question
// ===============================

export type Question = {
	id: string; // unique id
	promptEn: string; // English question
	choices: Choice[]; // 3 choices
};

// ===============================
// Game Status
// ===============================

export type GameStatus = 'idle' | 'playing' | 'finished';

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

// ===============================
// Public Choice
// ===============================

export type PublicChoice = {
	key: ChoiceKey;
	text: string;
};

// ===============================
// Public Question
// ===============================

export type PublicQuestion = {
	id: string;
	promptEn: string;
	choices: PublicChoice[];
};

// ===============================
// Game Session (DB + Service DTO)
// ===============================

export type SessionStatus = 'playing' | 'finished';

export type GameSessionRow = {
	id: string;
	player_name: string;
	status: SessionStatus;
	score: number;
	question_index: number;
	question_order_json: string;
	choice_order_json: string;
	expires_at: string;
	score_saved: number;
};

export type SubmitAnswerResult =
	| { status: 'not_found' }
	| { status: 'already_finished' }
	| { status: 'invalid_sequence' }
	| { status: 'invalid_choice' }
	| { status: 'invalid_session_data' }
	| { status: 'finished'; correct: boolean; score: number; timeLeftMs: number }
	| {
			status: 'continue';
			correct: boolean;
			score: number;
			questionIndex: number;
			question: PublicQuestion;
			timeLeftMs: number;
	  };

export type FinishGameSessionResult =
	| { status: 'not_found' }
	| { status: 'already_finished'; score: number; timeLeftMs: number }
	| { status: 'finished'; score: number; timeLeftMs: number };

export type StartGameResponse = {
	sessionStarted: true;
	sessionId: string;
	timeLeftMs: number;
	questionIndex: number;
	score: number;
	question: PublicQuestion;
};

export type AnswerGameResponse =
	| {
			finished: false;
			correct: boolean;
			score: number;
			questionIndex: number;
			question: PublicQuestion;
			timeLeftMs: number;
	  }
	| {
			finished: true;
			correct: boolean;
			score: number;
			timeLeftMs: number;
	  };

export type FinishGameResponse = {
	finished: true;
	score: number;
	timeLeftMs: number;
	alreadyFinished?: boolean;
};
