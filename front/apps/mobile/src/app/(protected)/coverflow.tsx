import * as Device from "expo-device";
import { Stack } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect } from "react";
import Coverflow from "~/pages/coverflow";

export default function CoverflowView() {
	//NOTE: This is broken for ios in expo 55.0 (?)
	useEffect(() => {
		const isMobile = Device.deviceType === Device.DeviceType.PHONE;
		if (isMobile) {
			ScreenOrientation.lockAsync(
				ScreenOrientation.OrientationLock.LANDSCAPE,
			);
		}
		return () => {
			if (isMobile) {
				ScreenOrientation.lockAsync(
					ScreenOrientation.OrientationLock.PORTRAIT_UP,
				);
			}
		};
	}, []);

	return (
		<>
			<Stack.Screen
				options={{
					orientation: "landscape",
					headerShown: false,
					statusBarHidden: true,
					navigationBarHidden: true,
					animation: "fade",
					gestureEnabled: false,
				}}
			/>
			<Coverflow />
		</>
	);
}
