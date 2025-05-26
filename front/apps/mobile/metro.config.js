const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
const path = require("node:path");

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-yarn-workspace-root`
const monorepoRoot = path.resolve(projectRoot, "../..");

// 1. Watch all files within the monorepo
config.watchFolders = [...config.watchFolders, monorepoRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
	...config.resolver.nodeModulesPaths,
	path.resolve(projectRoot, "node_modules"),
	path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
