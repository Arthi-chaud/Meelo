import { useCallback, useEffect, useRef } from "react";
import {
	type GestureResponderEvent,
	Pressable,
	type ViewStyle,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";
import { NavigationBar } from "./nav-bar";

type Props = { style: ViewStyle };
export const Controls = (props: Props) => {
	const opacity = useSharedValue(1);
	const animatedTheme = useAnimatedTheme();
	const timer = useRef(0);
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
			opacity: withSpring(
				opacity.value,
				animatedTheme.value.animations.fades,
			),
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
		<Animated.View style={[styles.root, opacityStyle, props.style]}>
			<Pressable style={styles.pressable} onPress={onPress}>
				<NavigationBar style={{ position: "absolute", top: 0 }} />
			</Pressable>
		</Animated.View>
	);
};

const styles = StyleSheet.create(() => ({
	root: { heigth: "100%", width: "100%" },
	pressable: { height: "100%", width: "100%" },
}));
