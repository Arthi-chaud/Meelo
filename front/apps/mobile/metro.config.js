const { getDefaultConfig } = require("expo/metro-config");
const {
	wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");
/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);
const path = require("node:path");

const ALIASES = {
	"iconsax-react": "iconsax-react-nativejs",
};

const projectRoot = __dirname;

function addMonorepoSupport(config) {
	const workspaceRoot = path.resolve(projectRoot, "../..");

	return {
		...config,
		watchFolders: [...config.watchFolders, workspaceRoot],
		resolver: {
			...config.resolver,
			nodeModulesPaths: [
				...config.resolver.nodeModulesPaths,
				path.resolve(projectRoot, "node_modules"),
				path.resolve(workspaceRoot, "node_modules"),
			],
		},
	};
}

module.exports = wrapWithReanimatedMetroConfig(
	addMonorepoSupport({
		...defaultConfig,
		resolver: {
			...defaultConfig.resolver,
			resolveRequest: (context, moduleName, platform) => {
				// Ensure you call the default resolver.
				return context.resolveRequest(
					context,
					ALIASES[moduleName] ?? moduleName,
					platform,
				);
			},
			requireCycleIgnorePatterns: [
				...defaultConfig.resolver.requireCycleIgnorePatterns,
				/.*/,
			],
		},
	}),
);
