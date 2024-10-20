import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const dev = process.argv.includes('dev');

const config = {
	preprocess: vitePreprocess(),
	
    kit: {
        appDir: 'app', // Required as the default is _app
        adapter: adapter(),
        paths: {
            base: dev ? '' : process.env.BASE_PATH,
        }
    },

};

export default config;
