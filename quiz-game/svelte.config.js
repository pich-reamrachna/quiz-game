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
				'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
				'img-src': ['self', 'data:', 'https:'],
				'font-src': ['self', 'data:', 'https://fonts.gstatic.com'],
				'connect-src': ['self'],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
			},
		},
	},
};

export default config;
