import { type ReactNode, useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

type Props = {
	isFlipped: boolean;
	cardStyle: ViewStyle;
	head: ReactNode;
	tail: ReactNode;
};

// The component that has a front (head) and back (tail) side. It can be flipped
export const FlipCard = ({ isFlipped, cardStyle, head, tail }: Props) => {
	const flippedS = useSharedValue(false);
	useEffect(() => {
		flippedS.value = isFlipped;
	}, [isFlipped]);

	const headStyle = useAnimatedStyle(() => {
		const spinValue = interpolate(Number(flippedS.value), [0, 1], [0, 180]);
		const scaleValue = interpolate(spinValue, [0, 60, 180], [1, 0.8, 1.5]);
		const rotateValue = withTiming(`${spinValue}deg`);

		return {
			transform: [
				{ rotateY: rotateValue },
				{ scale: withTiming(scaleValue) },
			],
		};
	});

	const tailStyle = useAnimatedStyle(() => {
		const spinValue = interpolate(
			Number(flippedS.value),
			[0, 1],
			[180, 360],
		);
		const scale = withTiming(
			interpolate(spinValue, [180, 240, 360], [1, 0.9, 1.5]),
		);
		const translateY = withTiming(
			interpolate(spinValue, [180, 360], [0, 30]),
		);
		const rotateY = withTiming(`${spinValue}deg`);

		return {
			transform: [{ rotateY }, { scale }, { translateY }],
		};
	});

	return (
		<View style={styles.root}>
			<Animated.View style={[styles.head, cardStyle, headStyle]}>
				{head}
			</Animated.View>
			<Animated.View style={[styles.tail, cardStyle, tailStyle]}>
				{tail}
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create(() => ({
	root: { flex: 1 },
	head: { zIndex: 1, position: "absolute" },
	tail: { zIndex: 2 },
}));
