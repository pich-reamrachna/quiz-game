import { browser } from '$app/environment';

/** 
 * UI Sound Effect Asset Imports 
 */
import clickSfx from '$lib/audio/UISounds_018_click.wav';
import wrongSfx from '$lib/audio/UISounds_021_wrong.wav';
import correctSfx from '$lib/audio/UISounds_023_correct.wav';
import countdownSfx from '$lib/audio/paoloargento-quiz-countdown-194417.mp3';

/** 
 * Funk BGM Asset Imports (1-9)
 */
import bgm1 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 01 - Pink Bloom.ogg";
import bgm2 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 02 - Portal to Underworld.ogg";
import bgm3 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 03 - To the Unknown.ogg";
import bgm4 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 04 - Valley of Spirits.ogg";
import bgm5 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 05 - Western Cyberhorse.ogg";
import bgm6 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 06 - Diamonds on The Ceiling.ogg";
import bgm7 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 07 - The Hidden One.ogg";
import bgm8 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 08 - Lost Spaceship's Signal.ogg";
import bgm9 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 09 - Lightyear City.ogg";

const SFX_MAP = {
    click: clickSfx,
    wrong: wrongSfx,
    correct: correctSfx,
    countdown: countdownSfx
};

const BGM_LIST = [bgm1, bgm2, bgm3, bgm4, bgm5, bgm6, bgm7, bgm8, bgm9];

/**
 * AudioManager handles all BGM transitions, SFX, and Autoplay policies.
 * Uses Svelte 5 runes for reactive mute state.
 */
class AudioManager {
    private bgm: HTMLAudioElement | null = null;
    private currentBgmPath: string | null = null;
    private homeBgmIndex: number | null = null;
    private hasUnlocked = false;

    // Persist mute state across sessions
    private _isMuted = $state(browser ? (localStorage.getItem('audio_muted') === 'true') : false);
    private _volume = 1; // Application output always matches system level

    get isMuted() { return this._isMuted; }
    set isMuted(value: boolean) {
        this._isMuted = value;
        if (browser) localStorage.setItem('audio_muted', String(value));
        if (this.bgm) this.bgm.muted = value;
    }

    get volume() { return this._volume; }

    /**
     * Plays the shared Home screen BGM (persists across Home/Credits)
     */
    async playHomeBgm() {
        if (!browser) return;
        if (this.homeBgmIndex === null) {
            this.homeBgmIndex = Math.floor(Math.random() * BGM_LIST.length);
        }
        await this.playBgm(this.homeBgmIndex);
    }

    /**
     * Specifically used for the Quiz gameplay countdown
     */
    async playQuizBgm() {
        await this.playBgmCustom(SFX_MAP.countdown, true);
    }

    /**
     * Core BGM logic: Handles fade transitions and path checking
     */
    async playBgm(index?: number, loop: boolean = true) {
        if (!browser) return;
        const path = index !== undefined ? BGM_LIST[index] : BGM_LIST[Math.floor(Math.random() * BGM_LIST.length)];
        
        if (this.currentBgmPath === path && this.bgm) {
            this.resumeBgm();
            return;
        }

        if (this.bgm) await this.fadeOut();

        this.bgm = new Audio(path);
        this.bgm.loop = loop;
        this.bgm.volume = 0; // Prepare for fade in
        this.bgm.muted = this.isMuted;
        this.currentBgmPath = path;
        
        this.attemptPlay();
    }

    /**
     * Internal BGM player for specific paths (non-library assets)
     */
    private async playBgmCustom(path: string, loop: boolean = true) {
        if (!browser) return;
        if (this.bgm) await this.fadeOut();
        this.bgm = new Audio(path);
        this.bgm.loop = loop;
        this.bgm.volume = 0;
        this.bgm.muted = this.isMuted;
        this.attemptPlay();
    }

    /**
     * Handles Autoplay blocks by falling back to muted playback
     */
    private async attemptPlay() {
        if (!this.bgm) return;
        try {
            await this.bgm.play();
            this.fadeIn(); // Fade in if site allows unmuted autoplay
        } catch {
            // Muted fallback for restricted browsers (Safari/Chrome)
            if (this.bgm) {
                this.bgm.muted = true;
                this.bgm.volume = this.volume; 
                this.bgm.play().catch(() => {});
            }
        }
    }

    private async resumeBgm() {
        if (!this.bgm || !this.bgm.paused) return;
        try {
            await this.bgm.play();
            this.fadeIn();
        } catch {
            this.attemptPlay();
        }
    }

    /**
     * Volume transitions
     */
    async fadeIn(duration = 2000) {
        const targetBgm = this.bgm;
        if (!targetBgm) return;
        const steps = 40;
        const volStep = this.volume / steps;
        targetBgm.volume = 0;

        for (let i = 0; i < steps; i++) {
            await new Promise(r => setTimeout(r, duration / steps));
            if (this.bgm !== targetBgm) return;
            targetBgm.volume = Math.min(this.volume, targetBgm.volume + volStep);
        }
    }

    async fadeOut(duration = 1000) {
        const targetBgm = this.bgm;
        if (!targetBgm) return;
        const steps = 20;
        const volStep = targetBgm.volume / steps;

        for (let i = 0; i < steps; i++) {
            await new Promise(r => setTimeout(r, duration / steps));
            if (this.bgm !== targetBgm) return;
            targetBgm.volume = Math.max(0, targetBgm.volume - volStep);
        }

        if (this.bgm === targetBgm) {
            this.bgm.pause();
            this.bgm = null;
            this.currentBgmPath = null;
        }
    }

    /**
     * Trigger a UI sound effect
     */
    playSfx(type: keyof typeof SFX_MAP) {
        if (!browser) return;
        const sfx = new Audio(SFX_MAP[type]);
        sfx.volume = this.volume;
        sfx.muted = this.isMuted;
        sfx.play().catch(() => {});
        this.unlockAudio(); // Interaction detected, try to unmute BGM
    }

    /**
     * Unlocks audio context on first user interaction
     */
    private unlockAudio() {
        if (!this.bgm) return;
        if (!this.isMuted) this.bgm.muted = false;

        if (this.bgm.paused) {
            this.bgm.play().then(() => {
                this.hasUnlocked = true;
                this.fadeIn();
            }).catch(() => {});
        } else if (!this.hasUnlocked) {
            this.fadeIn();
            this.hasUnlocked = true;
        }
    }

    /**
     * Initialize global window listeners to unlock audio
     */
    init() {
        if (!browser) return;
        const handler = () => {
            this.unlockAudio();
            if (this.hasUnlocked) {
                ['click', 'keydown', 'touchstart'].forEach(e => window.removeEventListener(e, handler));
            }
        };
        ['click', 'keydown', 'touchstart'].forEach(e => window.addEventListener(e, handler));
    }

    toggleMute() { this.isMuted = !this.isMuted; }
}

export const audioManager = new AudioManager();
if (browser) audioManager.init();
