import type { GameState, Question } from "$lib/types";

class GameEngine {
	private state: GameState;
	private questions: Question[] = [];
    private usedQuestionIndices: Set<string> = new Set();
	private timer: ReturnType<typeof setInterval> | null = null;

	constructor(questions: Question[]) {
        this.questions = questions;
		this.state = this.createInitialState();
	}

    // create initial game state
	private createInitialState(): GameState {
		return {
			status: 'idle',
			playerName: '',
			score: 0,
			questionCount: 0,
			currentQuestion: null,
			remainingMs: 0
		};
	}

    // start the game
	start(playerName: string, durationSeconds: number): void {
		if (durationSeconds <= 0) {
			throw new Error('Duration must be positive');
		}

        // reset game state
        this.usedQuestionIndices.clear();
		this.state = this.createInitialState();
		this.state.status = 'playing';
		this.state.playerName = playerName;
		this.state.remainingMs = durationSeconds * 1000;
	}

    // start the timer
	startTimer(
		durationSeconds: number,
		onTick: (timeLeftSeconds: number) => void,
		onElapsed: () => void
	): void {
		if (durationSeconds <= 0) {
			throw new Error('Duration must be positive');
		}

		this.stopTimer();
		this.state.remainingMs = durationSeconds * 1000;
		onTick(durationSeconds);

		this.timer = setInterval(() => {
			this.state.remainingMs = Math.max(0, this.state.remainingMs - 1000);
			onTick(Math.ceil(this.state.remainingMs / 1000));

			if (this.state.remainingMs <= 0) {
				this.stopTimer();
				onElapsed();
			}
		}, 1000);
	}

    // stop the timer
	stopTimer(): void {
		if (!this.timer) return;
		clearInterval(this.timer);
		this.timer = null;
	}

    // get current game state
	getState(): GameState {
		return { ...this.state };
	}

    // select next question
    nextQuestion(): void {
        if (this.state.status !== "playing") return;

        // filter unused questions
        const unusedQuestions = this.questions.filter(
            q => !this.usedQuestionIndices.has(q.id)
        );

        // if all questions are used, end the game
        if (unusedQuestions.length === 0){
            this.state.status = "finished";
            this.state.currentQuestion = null;
            return;
        }

        // select random unused question
        const randomIndex = Math.floor(Math.random() * unusedQuestions.length);
        const next = unusedQuestions[randomIndex];

        // shuffle options
        const shuffledOptions = this.shuffleQuestions(next.choices);

        // mark as used and update state
        this.usedQuestionIndices.add(next.id);
        this.state.currentQuestion = {
            ...next,
            choices: shuffledOptions
        };
        this.state.questionCount += 1;
    }

    //question shuffler function (Fisher-Yates algorithm)
    private shuffleQuestions<T>(array: T[]): T[] {
        const copy = [...array];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    //answer handling
    answer(choiceKey: string): void {
        if (this.state.status !== "playing" || !this.state.currentQuestion) return;

        const selected = this.state.currentQuestion.choices.find(c => c.key === choiceKey);
        if (!selected) return;

        if (selected.isCorrect) {
            this.state.score += 1; // score up
        }

        this.nextQuestion();
    }

    //timer countdown (tick)
    tick(deltaMs: number): void {
        if (this.state.status !== "playing") return;
        
        this.state.remainingMs -= deltaMs; //reduce remaining time
        
        if (this.state.remainingMs <= 0) {
            this.state.remainingMs = 0;
            this.state.status = "finished";
            this.state.currentQuestion = null;
        }
    }
    
}

export function createGameEngine(questions: Question[]) {
    return new GameEngine(questions);
}
