import type { ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";

export const expo: ExpoConfig = {
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
		package: IS_DEV ? "dev.arthichaud.meelo.dev" : "dev.artichaud.meelo",
	},
	plugins: [
		"expo-router",
		"expo-screen-orientation",
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
		[
			// https://docs.thewidlarzgroup.com/react-native-video/docs/v6/other/expo
			"react-native-video",
			{
				enableNotificationControls: true,
				enableBackgroundAudio: true,
				//TODO Picture in picture
			},
		],
	],
	experiments: {
		typedRoutes: true,
	},
	extra: {
		router: {},
		eas: {
			projectId: "b8d8dcdb-a905-4674-9c62-db4256e0d94f",
		},
	},
	ios: {
		bundleIdentifier: "com.arthichaud.meelo",
	},
};
