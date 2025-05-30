const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
const path = require("node:path");
const { withNativeWind } = require("nativewind/metro");

const ALIASES = {
	"iconsax-react": "iconsax-react-nativejs",
};

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
config.resolver.disableHierarchicalLookup = true;
config.resolver.resolveRequest = (context, moduleName, platform) => {
	// Ensure you call the default resolver.
	return context.resolveRequest(
		context,
		ALIASES[moduleName] ?? moduleName,
		platform,
	);
};

module.exports = withNativeWind(config, { input: "./styles/global.css" });
