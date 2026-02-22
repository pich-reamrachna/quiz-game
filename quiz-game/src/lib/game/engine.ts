import { type GameState } from "$lib/types";

class GameEngine { 
    private state: GameState; 

    constructor() { 
        this.state = this.createInitialState(); 
    } 

    private createInitialState(): GameState { 
        return { 
            status: "idle", 
            score: 0, 
            questionCount: 0, 
            currentQuestion: null, 
            remainingMs: 0, 
            playerName: "" 
        }; 
    }; 

    start(durationSeconds: number): void { 
        if (durationSeconds <= 0) { 
            throw new Error("Duration must be positive"); 
        } 
        
        this.state = { 
            status: "playing", 
            score: 0, 
            questionCount: 0, 
            currentQuestion: null, 
            remainingMs: durationSeconds * 1000, 
            playerName: "" 
        }; 
    } 

    getState(): GameState { 
        return {...this.state}; 
    } 


} 
export const engine = new GameEngine();