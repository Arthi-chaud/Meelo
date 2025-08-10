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
import { StyleSheet } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";

type Props = {
	onPress: (e: GestureResponderEvent) => void;
	onLongPress?: (e: GestureResponderEvent) => void;
	children: React.ReactNode;
	disabled?: boolean;
	style?: ComponentProps<typeof TouchableOpacity>["style"];
};

// Wrapper around TouchableOpacity
export const Pressable = ({
	onPress,
	children,
	style,
	disabled,
	onLongPress,
}: Props) => {
	const opacity = useSharedValue(1);
	const animatedTheme = useAnimatedTheme();
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
			onPressIn={onPressStart}
			onPressOut={onPressEnd}
			onPress={onPress}
			onLongPress={onLongPress}
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
