import { browser } from '$app/environment';

// Asset Imports
import clickSfx from '$lib/audio/UISounds_018_click.wav';
import wrongSfx from '$lib/audio/UISounds_021_wrong.wav';
import correctSfx from '$lib/audio/UISounds_023_correct.wav';
import countdownSfx from '$lib/audio/paoloargento-quiz-countdown-194417.mp3';

import bgm1 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 01 - Pink Bloom.ogg";
import bgm2 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 02 - Portal to Underworld.ogg";
import bgm3 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 03 - To the Unknown.ogg";
import bgm4 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 04 - Valley of Spirits.ogg";
import bgm5 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 05 - Western Cyberhorse.ogg";
import bgm6 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 06 - Diamonds on The Ceiling.ogg";
import bgm7 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 07 - The Hidden One.ogg";
import bgm8 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 08 - Lost Spaceship's Signal.ogg";
import bgm9 from "$lib/audio/funk bgm/DavidKBD - Pink Bloom Pack - 09 - Lightyear City.ogg";

const BGM_LIST = [bgm1, bgm2, bgm3, bgm4, bgm5, bgm6, bgm7, bgm8, bgm9];
const SFX_MAP = { click: clickSfx, wrong: wrongSfx, correct: correctSfx, countdown: countdownSfx };

// --- AUDIO SETTINGS  ---
const MASTER_VOLUME = 0.5;    // Global volume limit (0.0 to 1.0)
const FADE_DURATION = 2000;   // Duration of fade-in/out in ms
const CROSS_FADE_TIME = 3;    // Seconds skip before end to start cross-fade
// ---------------------------------------------------

/**
 * Manage all game audio: BGM playlists, SFX, and fade effects.
 */
class AudioManager {
    private bgm: HTMLAudioElement | null = null;
    private currentBgmPath: string | null = null;
    private playlistIndex: number | null = null;
    private transitionToken = 0;
    private hasUnlocked = false;
    private crossFadeTriggered = false;

    // Reactivity via Svelte 5 runes
    private _isMuted = $state(browser ? (localStorage.getItem('audio_muted') === 'true') : false);
    private readonly volume = MASTER_VOLUME;

    get isMuted() { return this._isMuted; }
    set isMuted(v: boolean) {
        this._isMuted = v;
        if (browser) localStorage.setItem('audio_muted', String(v));
        if (this.bgm) this.bgm.muted = v;
    }

    /**
     * Start/Resume the Home/Credit music.
     * Picks a random starting song once, then cycles sequentially (1->2->...->9->1)
     */
    async playHomeBgm() {
        if (!browser) return;
        
        // Don't restart if already playing a playlist track
        if (this.bgm && this.currentBgmPath && BGM_LIST.includes(this.currentBgmPath) && !this.bgm.paused) return;

        if (this.playlistIndex === null) {
            this.playlistIndex = Math.floor(Math.random() * BGM_LIST.length);
        }

        await this.playTrack(BGM_LIST[this.playlistIndex], true);
    }

    /**
     * Transition to the Quiz gameplay countdown music.
     */
    async playQuizBgm() {
        await this.playTrack(SFX_MAP.countdown, false);
    }

    /**
     * Core playback engine. Handles fade transitions and playlist auto-advance.
     */
    private async playTrack(path: string, isPlaylist: boolean) {
        if (!browser) return;
        const token = ++this.transitionToken;
        const oldBgm = this.bgm;

        // Reset cross-fade flag for new track
        this.crossFadeTriggered = false;

        // Smoothly fade out the OLD track if it's currently playing a different song
        if (oldBgm && this.currentBgmPath !== path) {
            this.fadeOutElement(oldBgm, FADE_DURATION, token);
        }

        if (token !== this.transitionToken) return;

        const audio = new Audio(path);
        audio.loop = !isPlaylist;
        audio.muted = this.isMuted;
        audio.volume = 0; 
        
        this.bgm = audio;
        this.currentBgmPath = path;

        if (isPlaylist) {
            // 1. End of track fallback
            audio.onended = () => {
                if (this.bgm !== audio) return;
                if (this.crossFadeTriggered) return;
                this.advancePlaylist();
            };

            // 2. Cross-fade trigger: start next song before this one ends
            audio.ontimeupdate = () => {
                if (this.bgm !== audio) return;
                if (this.crossFadeTriggered) return;
                if (audio.duration && audio.duration - audio.currentTime < CROSS_FADE_TIME) {
                    this.crossFadeTriggered = true;
                    this.advancePlaylist();
                }
            };
        }

        this.attemptPlay();
    }

    private advancePlaylist() {
        this.playlistIndex = (this.playlistIndex! + 1) % BGM_LIST.length;
        this.playTrack(BGM_LIST[this.playlistIndex], true);
    }

    private async attemptPlay() {
        if (!this.bgm) return;
        try {
            await this.bgm.play();
            this.fadeIn(FADE_DURATION);
        } catch {
            if (this.bgm) {
                this.bgm.muted = true;
                this.bgm.volume = this.volume;
                this.bgm.play().catch(() => {});
            }
        }
    }

    async fadeIn(duration: number) {
        const audio = this.bgm;
        if (!audio) return;
        const steps = 30, interval = duration / steps, stepVal = this.volume / steps;
        audio.volume = 0;
        for (let i = 0; i < steps; i++) {
            await new Promise(r => setTimeout(r, interval));
            if (this.bgm !== audio) return;
            audio.volume = Math.min(this.volume, audio.volume + stepVal);
        }
    }

    // New version that can target specific elements for cross-fading
    async fadeOutElement(audio: HTMLAudioElement, duration: number, token?: number) {
        if (!audio) return;
        const steps = 20, interval = duration / steps, stepVal = audio.volume / steps;
        for (let i = 0; i < steps; i++) {
            await new Promise(r => setTimeout(r, interval));
            // Only stop if a NEW explicit transition happened (token check)
            if (token && token !== this.transitionToken) break;
            audio.volume = Math.max(0, audio.volume - stepVal);
        }
        audio.pause();
        if (this.bgm === audio) {
            this.bgm = null;
            this.currentBgmPath = null;
        }
    }

    // Kept for backward compatibility if needed elsewhere
    async fadeOut(duration: number, token?: number) {
        if (this.bgm) await this.fadeOutElement(this.bgm, duration, token);
    }

    playSfx(type: keyof typeof SFX_MAP) {
        if (!browser) return;
        const sfx = new Audio(SFX_MAP[type]);
        sfx.muted = this.isMuted;
        sfx.play().catch(() => {});
        this.unlockAudio();
    }

    private unlockAudio() {
        if (!this.bgm || this.hasUnlocked) return;
        if (!this.isMuted) this.bgm.muted = false;
        if (this.bgm.paused) {
            this.bgm.play().then(() => (this.hasUnlocked = true)).catch(() => {});
        } else {
            this.hasUnlocked = true;
        }
    }

    init() {
        if (!browser) return;
        const unlock = () => {
            this.unlockAudio();
            if (this.hasUnlocked) {
                ['click', 'keydown', 'touchstart'].forEach((e) => {
                    window.removeEventListener(e, unlock);
                });
            }
        };
        ['click', 'keydown', 'touchstart'].forEach((e) => {
            window.addEventListener(e, unlock);
        });
    }

    toggleMute() { this.isMuted = !this.isMuted; }
}

export const audioManager = new AudioManager();
if (browser) audioManager.init();
