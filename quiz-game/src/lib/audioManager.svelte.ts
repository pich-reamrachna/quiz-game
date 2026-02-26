import { browser } from '$app/environment';

// SFX
import clickSfx from '$lib/audio/UISounds_018_click.wav';
import wrongSfx from '$lib/audio/UISounds_021_wrong.wav';
import correctSfx from '$lib/audio/UISounds_023_correct.wav';
import countdownSfx from '$lib/audio/paoloargento-quiz-countdown-194417.mp3';

// BGM
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

class AudioManager {
    private bgm: HTMLAudioElement | null = null;
    private currentBgmPath: string | null = null;
    private _isMuted = $state(browser ? (localStorage.getItem('audio_muted') === 'true') : false);
    private _volume = 1; // Always match system level (1.0)

    get isMuted() {
        return this._isMuted;
    }

    set isMuted(value: boolean) {
        this._isMuted = value;
        if (browser) localStorage.setItem('audio_muted', String(value));
        if (this.bgm) {
            this.bgm.muted = value;
        }
    }

    get volume() {
        return this._volume;
    }

    async playBgm(index?: number, loop: boolean = true) {
        if (!browser) return;
        
        const path = index !== undefined ? BGM_LIST[index] : BGM_LIST[Math.floor(Math.random() * BGM_LIST.length)];
        
        if (this.currentBgmPath === path && this.bgm) {
            this.resumeBgm();
            return;
        }

        if (this.bgm) {
            await this.fadeOut();
        }

        this.bgm = new Audio(path);
        this.bgm.loop = loop;
        this.bgm.volume = this.volume;
        this.bgm.muted = this.isMuted;
        this.currentBgmPath = path;
        
        this.attemptPlay();
    }

    private async attemptPlay() {
        if (!this.bgm) return;
        try {
            await this.bgm.play();
        } catch (e) {
            console.log('Autoplay blocked, trying muted...');
            if (this.bgm) {
                this.bgm.muted = true;
                try {
                    await this.bgm.play();
                } catch (e2) {
                    console.error('Muted autoplay also failed:', e2);
                }
            }
        }
    }

    private async resumeBgm() {
        if (!this.bgm || !this.bgm.paused) return;
        try {
            await this.bgm.play();
        } catch (e) {
            this.attemptPlay();
        }
    }

    async playQuizBgm() {
        await this.playBgmCustom(SFX_MAP.countdown, true);
    }

    private async playBgmCustom(path: string, loop: boolean = true) {
        if (!browser) return;
        if (this.bgm) await this.fadeOut();
        this.bgm = new Audio(path);
        this.bgm.loop = loop;
        this.bgm.volume = this.volume;
        this.bgm.muted = this.isMuted;
        this.attemptPlay();
    }

    async fadeOut(duration: number = 1000) {
        if (!this.bgm) return;
        
        const startVolume = this.bgm.volume;
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = startVolume / steps;

        for (let i = 0; i < steps; i++) {
            await new Promise(resolve => setTimeout(resolve, stepTime));
            if (this.bgm) {
                this.bgm.volume = Math.max(0, this.bgm.volume - volumeStep);
            }
        }

        if (this.bgm) {
            this.bgm.pause();
            this.bgm = null;
            this.currentBgmPath = null;
        }
    }

    playSfx(type: keyof typeof SFX_MAP) {
        if (!browser) return;
        const audio = new Audio(SFX_MAP[type]);
        audio.volume = this.volume;
        audio.muted = this.isMuted;
        audio.play().catch(e => console.error('SFX play failed:', e));

        // Interaction detected, try to ensure BGM is playing
        this.unlockAudio();
    }

    private hasUnlocked = false;
    private unlockAudio() {
        if (!this.bgm) return;
        
        // Restore volume/mute state on interaction
        if (!this.isMuted) {
            this.bgm.muted = false;
        }

        if (this.bgm.paused) {
            this.bgm.play()
                .then(() => {
                    this.hasUnlocked = true;
                    console.log('Audio unlocked via interaction');
                })
                .catch(() => {});
        } else {
            this.hasUnlocked = true;
        }
    }

    // Call this to setup global unlock listeners
    init() {
        if (!browser) return;
        const unlock = () => {
            this.unlockAudio();
            if (this.hasUnlocked) {
                window.removeEventListener('click', unlock);
                window.removeEventListener('keydown', unlock);
                window.removeEventListener('touchstart', unlock);
            }
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        window.addEventListener('touchstart', unlock);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
    }
}

export const audioManager = new AudioManager();
if (browser) audioManager.init();
