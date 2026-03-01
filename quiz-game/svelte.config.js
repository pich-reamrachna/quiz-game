import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'https:'],
				'font-src': ['self', 'data:'],
				'connect-src': ['self'],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'form-action': ['self']
			}
		}
	}

};

export default config;
