module.exports = (api) => {
	api.cache(true);
	return {
		presets: ["babel-preset-expo"],
		plugins: [
			[
				"react-native-unistyles/plugin",
				{
					root: "src",
				},
			],
			"react-native-reanimated/plugin", // Always keep last
		],
	};
};
