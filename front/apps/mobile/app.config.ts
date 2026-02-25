import type { ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";

module.exports = (_: ExpoConfig): ExpoConfig => ({
	name: IS_DEV ? "Meelo (Dev)" : "Meelo",
	slug: "meelo",
	version: "1.0.0",
	icon: "./assets/icon-black.png",
	scheme: "mobile",
	userInterfaceStyle: "automatic",
	newArchEnabled: true,
	android: {
		icon: "./assets/icon-black.png",
		edgeToEdgeEnabled: true,
		userInterfaceStyle: "automatic",
		package: IS_DEV ? "dev.arthichaud.meelo.dev" : "dev.artichaud.meelo",
		permissions: [
			"android.permission.FOREGROUND_SERVICE",
			"android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
		],
	},
	ios: {
		icon: {
			dark: "./assets/icon-black.png",
			light: "./assets/icon-white.png",
			tinted: "./assets/icon-white.png",
		},
		userInterfaceStyle: "automatic",
		bundleIdentifier: "com.arthichaud.meelo",
		supportsTablet: true,
		infoPlist: {
			UIViewControllerBasedStatusBarAppearance: true,
		},
	},
	plugins: [
		"expo-router",
		[
			"@kesha-antonov/react-native-background-downloader",
			{
				skipMmkvDependency: true,
			},
		],
		[
			"expo-screen-orientation",
			{
				initialOrientation: "DEFAULT",
			},
		],
		[
			"expo-splash-screen",
			{
				image: "./assets/icon-black.png",
				resizeMode: "contain",
				imageWidth: 200,
				backgroundColor: "#ffffff",
				dark: {
					image: "./assets/icon-white.png",
					backgroundColor: "#242120",
				},
			},
		],
		[
			"expo-build-properties",
			{
				android: {
					usesCleartextTraffic: true,
				},
			},
		],
		[
			"expo-asset",
			{
				assets: [
					"./assets/banner1_white.png",
					"./assets/banner1_black.png",
				],
			},
		],
		"./plugins/withMediaServicePlugin.ts",
		[
			// https://docs.thewidlarzgroup.com/react-native-video/docs/v7/configuration/expo-plugin
			"react-native-video",
			{
				enableBackgroundAudio: true,
				//TODO Picture in picture
			},
		],
	],
	experiments: {
		typedRoutes: true,
		reactCompiler: true,
	},
	extra: {
		router: {},
		eas: {
			projectId: "b8d8dcdb-a905-4674-9c62-db4256e0d94f",
		},
	},
});
