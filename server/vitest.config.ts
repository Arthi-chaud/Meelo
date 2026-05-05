import { resolve } from "node:path";
import swc from "unplugin-swc";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import CustomSequencer from "./test/sequencer";

export default defineConfig({
	oxc: false,
	test: {
		globals: true,
		root: "./",
		watch: false,
		testTimeout: 60000,
		env: loadEnv("", process.cwd(), ""),
		maxWorkers: 1,
		maxConcurrency: 1,
		fileParallelism: false,
		sequence: { concurrent: false, sequencer: CustomSequencer },
		coverage: {
			provider: "v8",
			reporter: "lcov",
			include: ["src/**/*.ts"],
			reportOnFailure: true,
			reportsDirectory: "coverage",
		},
	},
	plugins: [
		swc.vite({
			module: { type: "es6" },
		}),
	],
	resolve: {
		alias: {
			src: resolve(__dirname, "./src"),
			test: resolve(__dirname, "./test"),
		},
	},
});
