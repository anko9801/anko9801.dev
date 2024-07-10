/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
		animation: {
			"slide-in-bottom":
				"slide-in-bottom 1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both",
		},
		keyframes: {
			"slide-in-bottom": {
				"0%": {
					scale: "0",
					opacity: "1",
					translate: "-50% -50%"
				},
				"100%": {
					scale: "1",
					opacity: "0",
					translate: "-50% -50%"
				},
			},
		},
	},
	plugins: [],
}
