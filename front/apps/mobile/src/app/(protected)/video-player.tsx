import * as Device from "expo-device";
import { Tabs, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { currentTrackAtom } from "~/components/player/state";

//TODO Hide bottom nav bar

export default function FullscreenVideoPlayer() {
	const router = useRouter();
	const [currentTrack] = useAtom(currentTrackAtom);
	useEffect(() => {
		if (currentTrack?.track.type !== "Video") router.back();
	}, [currentTrack]);
	useEffect(() => {
		const isMobile = Device.deviceType !== Device.DeviceType.TABLET;
		if (isMobile) {
			// Allowing mobiles to use landscape mode
			ScreenOrientation.unlockAsync();
		}
		return () => {
			isMobile &&
				ScreenOrientation.lockAsync(
					ScreenOrientation.OrientationLock.PORTRAIT,
				);
		};
	}, []);
	return (
		<>
			<Tabs.Screen
				options={{
					headerShown: false,
				}}
			/>
			<View style={styles.root} />
		</>
	);
}

const styles = StyleSheet.create(() => ({
	root: { flex: 1, backgroundColor: "black" },
}));
