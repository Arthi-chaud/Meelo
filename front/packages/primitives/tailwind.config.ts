import type { Config } from "tailwindcss";
export default {
	content: ["./src/**/*.{ts,tsx}"],
	presets: [
		require("nativewind/preset"),
		require("../../apps/mobile/tailwind.config"),
	],
	theme: {},
	plugins: [],
} satisfies Config;
