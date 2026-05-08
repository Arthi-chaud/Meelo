import type { ConfigContext, ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";

export default (_: ConfigContext): ExpoConfig => ({
	name: IS_DEV ? "Meelo (Dev)" : "Meelo",
	slug: "meelo",
	scheme: "mobile",
	userInterfaceStyle: "automatic",
	android: {
		icon: "./assets/icon-black.png",
		userInterfaceStyle: "automatic",
		package: IS_DEV ? "dev.arthichaud.meelo.dev" : "dev.artichaud.meelo",
		permissions: [
			"android.permission.FOREGROUND_SERVICE",
			"android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
		],
	},
	updates: { enabled: false },
	ios: {
		icon: "./assets/icon.icon",
		userInterfaceStyle: "automatic",
		bundleIdentifier: "com.arthichaud.meelo",
		appleTeamId: "HJ45QP4WWR",
		supportsTablet: true,
		requireFullScreen: true, // NOTE: When set to false, the coverflow does not rotate automatically
		config: { usesNonExemptEncryption: false },
		infoPlist: {
			UIViewControllerBasedStatusBarAppearance: true,
			CFBundleShortVersionString: "$(MARKETING_VERSION)",
			CFBundleVersion: "$(CURRENT_PROJECT_VERSION)",
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
			"expo-media-control",
			{
				enableBackgroundAudio: true,
				audioSessionCategory: "playback",
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
