import { useCallback, useEffect, useRef } from "react";
import {
	type GestureResponderEvent,
	Pressable,
	View,
	type ViewStyle,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { ScopedTheme, StyleSheet } from "react-native-unistyles";
import { animations } from "~/theme";
import { Bottom } from "./bottom";
import { NavigationBar } from "./nav-bar";
import { PlaybackControls } from "./playback";

type Props = { style: ViewStyle; close: () => void };
export const Controls = (props: Props) => {
	const opacity = useSharedValue(1);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hideControlsAfterDelay = useCallback(
		(delay?: number) => {
			if (timer.current) {
				clearTimeout(timer.current);
			}
			timer.current = setTimeout(() => {
				opacity.value = 0;
			}, delay ?? 5000);
		},
		[opacity],
	);
	const opacityStyle = useAnimatedStyle(() => {
		return {
			opacity: withTiming(opacity.value, animations.fades),
		};
	});
	useEffect(() => {
		hideControlsAfterDelay();
	});

	const onPress = useCallback((e: GestureResponderEvent) => {
		if (opacity.value === 1) {
			hideControlsAfterDelay(0);
		} else {
			e.stopPropagation();
			opacity.value = 1;
			hideControlsAfterDelay();
		}
	}, []);
	return (
		<ScopedTheme name="dark">
			<Animated.View style={[styles.root, opacityStyle, props.style]}>
				<Pressable style={styles.pressable} onPress={onPress}>
					<NavigationBar
						style={styles.navigationHeader}
						close={props.close}
					/>
					<View style={styles.playbackControls}>
						<PlaybackControls />
					</View>
					<Bottom style={styles.bottomControls} />
				</Pressable>
			</Animated.View>
		</ScopedTheme>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: { heigth: "100%", width: "100%" },
	pressable: { height: "100%", width: "100%" },
	navigationHeader: { position: "absolute", top: 0 },
	playbackControls: {
		height: "100%",
		position: "absolute",
		top: 0,
		bottom: 0,
		width: "100%",
		justifyContent: "center",
	},
	bottomControls: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		padding: theme.gap(2),
		paddingBottom: theme.gap(3), // For safe area
	},
}));
