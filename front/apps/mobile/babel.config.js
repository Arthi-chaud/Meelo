module.exports = (api) => {
	api.cache(true);
	return {
		presets: [
			[
				"babel-preset-expo",
				{
					// Needed for jotai in dev (?)
					unstable_transformImportMeta: true,
				},
			],
		],
		plugins: [
			[
				"react-native-unistyles/plugin",
				{
					root: "src",
				},
			],
			"react-native-worklets/plugin", // Always keep last
		],
	};
};
