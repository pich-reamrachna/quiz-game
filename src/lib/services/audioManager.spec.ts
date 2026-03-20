import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$app/environment', () => ({
	browser: true,
}))

type AudioLike = {
	src: string
	paused: boolean
	muted: boolean
	volume: number
	loop: boolean
	duration: number
	currentTime: number
	play: ReturnType<typeof vi.fn>
	pause: ReturnType<typeof vi.fn>
	onended: (() => void) | undefined
	ontimeupdate: (() => void) | undefined
}

async function loadManager(opts: { storedMuted?: string; rejectPlay?: boolean } = {}): Promise<{
	audioManager: {
		isMuted: boolean
		toggleMute: () => void
		playSfx: (type: 'click' | 'wrong' | 'correct' | 'countdown') => void
		playHomeBgm: () => Promise<void>
		playQuizBgm: () => Promise<void>
		fadeOutElement: (audio: AudioLike, duration: number, token?: number) => Promise<void>
		fadeIn: (duration: number) => Promise<void>
		init: () => void
		bgm?: AudioLike
		currentBgmPath?: string
	}
	audios: AudioLike[]
	store: Map<string, string>
	addEventListener: ReturnType<typeof vi.fn>
	removeEventListener: ReturnType<typeof vi.fn>
	listeners: Map<string, EventListener[]>
}> {
	vi.resetModules()
	const store = new Map<string, string>()
	if (opts.storedMuted !== undefined) store.set('audio_muted', opts.storedMuted)

	const listeners = new Map<string, EventListener[]>()
	const addEventListener = vi.fn((event: string, cb: EventListener) => {
		const existing = listeners.get(event) ?? []
		existing.push(cb)
		listeners.set(event, existing)
	})
	const removeEventListener = vi.fn((event: string, cb: EventListener) => {
		const existing = listeners.get(event) ?? []
		listeners.set(
			event,
			existing.filter((x) => x !== cb),
		)
	})

	vi.stubGlobal('localStorage', {
		getItem: (k: string) => store.get(k),
		setItem: (k: string, v: string) => {
			store.set(k, v)
		},
	})
	vi.stubGlobal('window', { addEventListener, removeEventListener })

	const audios: AudioLike[] = []
	class FakeAudio implements AudioLike {
		src: string
		paused = true
		muted = false
		volume = 1
		loop = false
		duration = 10
		currentTime = 0
		onended: (() => void) | undefined = undefined
		ontimeupdate: (() => void) | undefined = undefined

		constructor(src: string) {
			this.src = src
			audios.push(this)
		}

		play = vi.fn(() => {
			if (opts.rejectPlay) return Promise.reject(new Error('blocked'))
			this.paused = false
			return Promise.resolve()
		})

		pause = vi.fn(() => {
			this.paused = true
		})
	}

	vi.stubGlobal('Audio', FakeAudio as never)

	const mod = await import('./audioManager.svelte')
	const audioManager = mod.audioManager as unknown as {
		isMuted: boolean
		toggleMute: () => void
		playSfx: (type: 'click' | 'wrong' | 'correct' | 'countdown') => void
		playHomeBgm: () => Promise<void>
		playQuizBgm: () => Promise<void>
		fadeOutElement: (audio: AudioLike, duration: number, token?: number) => Promise<void>
		fadeIn: (duration: number) => Promise<void>
		init: () => void
		bgm?: AudioLike
		currentBgmPath?: string
	}

	return { audioManager, audios, store, addEventListener, removeEventListener, listeners }
}

describe('audioManager service', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.unstubAllGlobals()
	})

	it('plays click sfx and unlocks through browser audio path', async () => {
		const { audioManager, audios } = await loadManager()

		audioManager.playSfx('click')

		expect(audios.length).toBe(1)
		expect(audios[0]?.play).toHaveBeenCalledTimes(1)
	})

	it('toggles mute and persists muted state in localStorage', async () => {
		const { audioManager, store } = await loadManager({ storedMuted: 'false' })

		audioManager.toggleMute()
		expect(audioManager.isMuted).toBe(true)
		expect(store.get('audio_muted')).toBe('true')

		audioManager.toggleMute()
		expect(audioManager.isMuted).toBe(false)
		expect(store.get('audio_muted')).toBe('false')
	})

	it('starts home bgm once and does not restart while playlist track is already playing', async () => {
		const { audioManager, audios } = await loadManager()
		vi.spyOn(audioManager, 'fadeIn').mockResolvedValue()

		await audioManager.playHomeBgm()
		const afterFirst = audios.length
		await audioManager.playHomeBgm()

		expect(afterFirst).toBeGreaterThan(0)
		expect(audios.length).toBe(afterFirst)
	})

	it('fades out and clears active bgm reference when fading current element', async () => {
		const { audioManager, audios } = await loadManager()
		const audio = new Audio('track.ogg') as unknown as AudioLike
		audio.volume = 0.5
		audioManager.bgm = audio
		audioManager.currentBgmPath = 'track.ogg'

		await audioManager.fadeOutElement(audio, 0)

		expect(audio.pause).toHaveBeenCalledTimes(1)
		expect(audioManager.bgm).toBeUndefined()
		expect(audioManager.currentBgmPath).toBeUndefined()
		expect(audios.length).toBeGreaterThan(0)
	})

	it('registers unlock listeners on init and removes them after successful unlock', async () => {
		const { audioManager, addEventListener, removeEventListener, listeners } = await loadManager()
		const bgm = new Audio('bgm.ogg') as unknown as AudioLike
		bgm.paused = true
		audioManager.bgm = bgm
		audioManager.isMuted = false

		const addedBefore = addEventListener.mock.calls.length
		audioManager.init()
		expect(addEventListener.mock.calls.length).toBe(addedBefore + 3)

		const clickHandlers = listeners.get('click') ?? []
		expect(clickHandlers.length).toBeGreaterThan(0)
		for (const handler of clickHandlers) handler({} as Event)
		await Promise.resolve()

		expect(removeEventListener.mock.calls.length).toBeGreaterThanOrEqual(3)
	})

	it('playQuizBgm still plays when first autoplay attempt is blocked', async () => {
		const { audioManager, audios } = await loadManager({ rejectPlay: true })

		await audioManager.playQuizBgm()
		expect(audios.length).toBeGreaterThan(0)
		expect(audios[0]?.play).toHaveBeenCalled()
	})
})
