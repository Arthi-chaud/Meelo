import * as Device from "expo-device";
import { Stack, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { setStatusBarHidden } from "expo-status-bar";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { VideoView } from "react-native-video";
import { videoPlayerAtom } from "~/components/player/context";
import { currentTrackAtom } from "~/components/player/state";
import { Controls } from "~/pages/video-player/controls";

//TODO Try to avoid flicker from the video player

export default function FullscreenVideoPlayer() {
	const isMobile = Device.deviceType !== Device.DeviceType.TABLET;
	const router = useRouter();
	const [currentTrack] = useAtom(currentTrackAtom);
	const player = useAtomValue(videoPlayerAtom);
	const closePlayer = useCallback(() => {
		if (isMobile) {
			ScreenOrientation.lockAsync(
				ScreenOrientation.OrientationLock.PORTRAIT_UP,
			).then(() => router.back());
		} else router.back();
	}, [isMobile]);
	useEffect(() => {
		if (currentTrack?.track.type !== "Video") closePlayer();
	}, [currentTrack, closePlayer]);
	useEffect(() => {
		if (isMobile) {
			// Allowing mobiles to use landscape mode
			ScreenOrientation.unlockAsync();
		}
		if (Platform.OS !== "ios") {
			setStatusBarHidden(true);
		}
	}, []);
	const insets = useSafeAreaInsets();
	return (
		<>
			<Stack.Screen
				options={{
					headerShown: false,
					presentation: "fullScreenModal",
					statusBarHidden: true,
					navigationBarHidden: true,
					animation: "none",
				}}
			/>
			<SafeAreaView style={styles.root}>
				<Controls
					style={[
						styles.controls,
						{ top: insets.top, bottom: insets.bottom },
					]}
					close={closePlayer}
				/>
				{player && (
					<VideoView
						player={player}
						keepScreenAwake
						style={{ height: "100%", width: "100%" }}
					/>
				)}
			</SafeAreaView>
		</>
	);
}

const styles = StyleSheet.create(() => ({
	root: { flex: 1, backgroundColor: "#000000" },
	controls: {
		alignSelf: "center",
		position: "absolute",
		zIndex: 1,
	},
}));
