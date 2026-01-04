import dotenv from "dotenv";
import type { Config } from "jest";

dotenv.config({ path: ".env" });
const config: Config = {
	testTimeout: 150000,
	moduleFileExtensions: ["js", "json", "ts"],
	roots: ["<rootDir>", "src"],
	modulePaths: ["<rootDir>", "src"],
	modulePathIgnorePatterns: ["<rootDir>/dist"],
	testRegex: ".*\\.spec\\.ts$",
	transform: {
		"^.+\\.(t|j)s$": "ts-jest",
	},
	collectCoverageFrom: ["<rootDir>/src/**/*.(t|j)s"],
	coverageDirectory: "coverage",
	coverageReporters: ["lcov"],
	testEnvironment: "node",
	testSequencer: "<rootDir>/test/sequencer.ts",
};

export default config;
