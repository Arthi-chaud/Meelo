import type { Config } from "tailwindcss";
export default {
	content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			fontFamily: {
				"rubik-light": ["Rubik_300Light"],
				"rubik-regular": ["Rubik_400Regular"],
				"rubik-medium": ["Rubik_500Medium"],
				"rubik-semibold": ["Rubik_600SemiBold"],
				"rubik-bold": ["Rubik_700Bold"],
				"rubik-extrabold": ["Rubik_800ExtraBold"],
				"rubik-black": ["Rubik_900Black"],
			},
		},
	},
	plugins: [],
} satisfies Config;
