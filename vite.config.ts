import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';

export default defineConfig({
	plugins: [
		react(),
		electron({
			main: {
				entry: 'electron/main.ts'
			},
			preload: {
				input: 'electron/preload.ts'
			}
		}),

		electron({
			main: {
				entry: 'electron/cleanup/scanner.worker.ts'
			}
		})
	],

	base: './'
});
