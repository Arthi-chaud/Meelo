import { type ComponentProps, useCallback } from "react";
import {
	type GestureResponderEvent,
	Pressable as P,
	type View,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import type { ViewProps } from "react-native-svg/lib/typescript/fabric/utils";
import { StyleSheet } from "react-native-unistyles";
import { animations } from "~/theme";

type Props = {
	onPress: (e: GestureResponderEvent) => void;
	onLongPress?: (e: GestureResponderEvent) => void;
	children: React.ReactNode;
	disabled?: boolean;
	disableRequestAnimationFrame?: boolean;
	style?: ComponentProps<typeof View>["style"];
	onLayout?: ViewProps["onLayout"];
};

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
		opacity.value = withTiming(
			animations.pressable.opacityOnPress,
			animations.pressable.config,
		);
	}, []);
	const onPressEnd = useCallback(() => {
		opacity.value = withTiming(1, animations.pressable.config);
	}, []);
	const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
	const pressIn = disabled ? undefined : onPressStart;
	const pressOut = disabled ? undefined : onPressEnd;
	const press = disabled ? undefined : onPress_;
	const longPress = disabled ? undefined : onLongPress;
	return (
		<P
			//TODO Hover
			disabled={disabled}
			android_disableSound={true}
			onPressIn={pressIn}
			onPressOut={pressOut}
			onPress={press}
			onLongPress={longPress}
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
