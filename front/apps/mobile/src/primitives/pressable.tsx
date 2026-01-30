import { type ComponentProps, useCallback } from "react";
import {
	type GestureResponderEvent,
	Pressable as P,
	type TouchableOpacity,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import type { ViewProps } from "react-native-svg/lib/typescript/fabric/utils";
import { StyleSheet } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";

type Props = {
	onPress: (e: GestureResponderEvent) => void;
	onLongPress?: (e: GestureResponderEvent) => void;
	children: React.ReactNode;
	disabled?: boolean;
	disableRequestAnimationFrame?: boolean;
	style?: ComponentProps<typeof TouchableOpacity>["style"];
	onLayout?: ViewProps["onLayout"];
};

// Wrapper around TouchableOpacity
export const Pressable = ({
	onPress,
	children,
	style,
	disabled,
	onLongPress,
	disableRequestAnimationFrame,
	onLayout,
}: Props) => {
	const opacity = useSharedValue(1);
	const animatedTheme = useAnimatedTheme();
	const onPress_ = useCallback(
		(e: GestureResponderEvent) => {
			if (disableRequestAnimationFrame) {
				onPress(e);
			} else {
				//https://reactnative.dev/docs/performance.html#my-touchablex-view-isnt-very-responsive
				requestAnimationFrame(() => onPress(e));
			}
		},
		[onPress],
	);
	const onPressStart = useCallback(() => {
		opacity.value = withSpring(
			0.5,
			animatedTheme.value.animations.pressable,
		);
	}, []);
	const onPressEnd = useCallback(() => {
		opacity.value = withSpring(1, animatedTheme.value.animations.pressable);
	}, []);
	const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
	return (
		<P
			//TODO Hover
			disabled={disabled}
			android_disableSound={true}
			onPressIn={!disabled ? onPressStart : undefined}
			onPressOut={!disabled ? onPressEnd : undefined}
			onPress={!disabled ? onPress_ : undefined}
			onLongPress={!disabled ? onLongPress : undefined}
			onLayout={onLayout}
		>
			<Animated.View style={[styles.root, animatedStyle, style]}>
				{children}
			</Animated.View>
		</P>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		borderRadius: theme.borderRadius,
		paddingHorizontal: theme.gap(1),
		overflow: "hidden",
	},
}));
