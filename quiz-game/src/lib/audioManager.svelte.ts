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
    private transitionToken = 0;
    private bgm: HTMLAudioElement | null = null;
    private currentBgmPath: string | null = null;
    private _currentPlaylistIndex: number | null = null;
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
        
        // If we are already playing a funk BGM, don't restart or skip it
        const isHomeBgmPlaying = this.bgm && 
                                 this.currentBgmPath && 
                                 BGM_LIST.includes(this.currentBgmPath);

        if (isHomeBgmPlaying && !this.bgm?.paused) {
            console.log('Home BGM already playing, skipping redundant call');
            return;
        }

        // Start playing the playlist without forcing the next track
        await this.playBgm(undefined, true, false);
    }

    /**
     * Specifically used for the Quiz gameplay countdown
     */
    async playQuizBgm() {
        await this.playBgmCustom(SFX_MAP.countdown, false); // Loop countdown
    }

    
    async playBgm(index?: number, isPlaylist: boolean = true, forceNext: boolean = false) {
        if (!browser) return;
        const token = ++this.transitionToken;
        
        // 1. Resolve which track to play
        if (index !== undefined) {
            this._currentPlaylistIndex = index;
        } else if (this._currentPlaylistIndex === null) {
            // Pick a random starting point first time
            this._currentPlaylistIndex = Math.floor(Math.random() * BGM_LIST.length);
        } else if (forceNext && isPlaylist) {
            // Explicit advance to next song
            this._currentPlaylistIndex = (this._currentPlaylistIndex + 1) % BGM_LIST.length;
        }

        const path = BGM_LIST[this._currentPlaylistIndex];
        
        // 2. Check if we are already playing this exact file
        if (this.currentBgmPath === path && this.bgm) {
            this.resumeBgm();
            return;
        }

        // 3. Ensure this transition is still the most recent one
        if (token !== this.transitionToken) return;

        // Fade out existing audio if any
        if (this.bgm) await this.fadeOut(1000, token);

        // Check again after async fade
        if (token !== this.transitionToken) return;

        // 4. Create and configure new audio element
        const audio = new Audio(path);
        audio.loop = !isPlaylist;
        audio.volume = 0; // Prepare for fade in
        audio.muted = this.isMuted;
        
        this.bgm = audio;
        this.currentBgmPath = path;

        // Set up event listeners for playlist progression and errors
        if (isPlaylist) {
            audio.addEventListener('ended', () => {
                console.log(`BGM ${this._currentPlaylistIndex} ended, advancing...`);
                // Advance to next track automatically
                this.playBgm(undefined, true, true);
            });
        }

        audio.addEventListener('error', (e) => {
            console.error('BGM Error, attempting next track:', e);
            if (isPlaylist) this.playBgm(undefined, true, true);
        });

        this.attemptPlay();
    }

    /**
     * Internal BGM player for specific paths (non-library assets)
     */
    private async playBgmCustom(path: string, isPlaylist: boolean = true) {
        const token = ++this.transitionToken;
        if (!browser) return;
        if (token !== this.transitionToken) return;
        
        if (this.bgm) await this.fadeOut(1000, token);

        if (token !== this.transitionToken) return;

        const audio = new Audio(path);
        audio.loop = !isPlaylist;
        audio.volume = 0;
        audio.muted = this.isMuted;
        
        this.bgm = audio;
        this.currentBgmPath = path;

        if (isPlaylist) {
            audio.addEventListener('ended', () => this.playBgm(undefined, true, true));
        }

        this.attemptPlay();
    }

    /**
     * Handles Autoplay blocks by falling back to muted playback if necessary
     */
    private async attemptPlay() {
        const audio = this.bgm;
        if (!audio) return;

        try {
            await audio.play();
            // If successful unmuted, start volume fade in
            this.fadeIn();
        } catch (e) {
            console.log('Unmuted playback blocked, falling back to muted...');
            // Fallback: start muted
            audio.muted = true;
            audio.volume = this.volume; 
            audio.play().catch(e2 => console.error('Even muted playback failed:', e2));
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
     * Smoothly increases volume from 0 to target
     */
    async fadeIn(duration = 2000) {
        const targetBgm = this.bgm;
        if (!targetBgm) return;
        
        const steps = 40;
        const volStep = this.volume / steps;
        targetBgm.volume = 0;

        for (let i = 0; i < steps; i++) {
            await new Promise(r => setTimeout(r, duration / steps));
            // Abort if the manager has switched to a different BGM
            if (this.bgm !== targetBgm) return;
            targetBgm.volume = Math.min(this.volume, targetBgm.volume + volStep);
        }
    }

    /**
     * Smoothly decreases volume to 0 before stopping
     */
    async fadeOut(duration = 1000, token?: number) {
        const targetBgm = this.bgm;
        if (!targetBgm) return;

        const steps = 20;
        const volStep = targetBgm.volume / steps;

        for (let i = 0; i < steps; i++) {
            await new Promise(r => setTimeout(r, duration / steps));
            // Abort if transition token expires or BGM changes
            if (token !== undefined && token !== this.transitionToken) return;
            if (this.bgm !== targetBgm) return;
            targetBgm.volume = Math.max(0, targetBgm.volume - volStep);
        }

        if (this.bgm === targetBgm) {
            targetBgm.pause();
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
        
        // Use user interaction as an opportunity to unlock unmuted BGM
        this.unlockAudio();
    }

    /**
     * Unlocks unmuted BGM playback once a user interaction has been detected
     */
    private unlockAudio() {
        if (!this.bgm) return;
        
        // Unmute if user interaction allowed it
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
     * Sets up global window listeners to capture the first user interaction
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
