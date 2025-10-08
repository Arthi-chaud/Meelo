import * as Device from "expo-device";
import { Stack, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { setStatusBarHidden } from "expo-status-bar";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { VideoView } from "react-native-video";
import { videoPlayerAtom } from "~/components/player/context";
import { currentTrackAtom } from "~/components/player/state";
import { Controls } from "~/pages/video-player/controls";

export default function FullscreenVideoPlayer() {
	const router = useRouter();
	const [currentTrack] = useAtom(currentTrackAtom);
	const player = useAtomValue(videoPlayerAtom);
	useEffect(() => {
		if (currentTrack?.track.type !== "Video") router.back();
	}, [currentTrack]);
	useEffect(() => {
		const isMobile = Device.deviceType !== Device.DeviceType.TABLET;
		if (isMobile) {
			// Allowing mobiles to use landscape mode
			ScreenOrientation.unlockAsync();
		}
		setStatusBarHidden(true);
		return () => {
			isMobile &&
				ScreenOrientation.lockAsync(
					ScreenOrientation.OrientationLock.PORTRAIT,
				);
		};
	}, []);
	return (
		<>
			<Stack.Screen
				options={{
					headerShown: false,
				}}
			/>
			<SafeAreaView style={styles.root}>
				<Controls style={styles.controls} />
				{player && (
					<VideoView
						player={player}
						style={{ height: "100%", width: "100%" }}
					/>
				)}
			</SafeAreaView>
		</>
	);
}

const styles = StyleSheet.create(() => ({
	root: { flex: 1, backgroundColor: "black" },
	controls: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 1,
	},
}));
