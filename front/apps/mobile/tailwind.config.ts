import type { Config } from "tailwindcss";
export default {
	content: [
		"./app/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"../../packages/primitives/src/**/*.{ts,tsx}",
	],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			fontFamily: {
				rubik: ["Rubik_400Regular"],
				"rubik-light": ["Rubik_300Light"],
				"rubik-regular": ["Rubik_400Regular"],
				"rubik-medium": ["Rubik_500Medium"],
				"rubik-semibold": ["Rubik_600SemiBold"],
				"rubik-bold": ["Rubik_700Bold"],
				"rubik-extrabold": ["Rubik_800ExtraBold"],
				"rubik-black": ["Rubik_900Black"],
			},
			colors: {
				"primary-light": "#242120",
				"secondary-light": "#242120",
				"surface-light": "#efefef",
				"primary-dark": "#ffffff",
				"secondary-dark": "#ffffff",
				"surface-dark": "#242120",
			},
		},
	},
	plugins: [],
} satisfies Config;
