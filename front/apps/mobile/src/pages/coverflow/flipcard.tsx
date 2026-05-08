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
		const rotateValue = withTiming(`${spinValue}deg`);

		return {
			transform: [{ rotateY: rotateValue }],
		};
	});

	const tailStyle = useAnimatedStyle(() => {
		const spinValue = interpolate(
			Number(flippedS.value),
			[0, 1],
			[180, 360],
		);
		const rotateValue = withTiming(`${spinValue}deg`);

		return {
			transform: [{ rotateY: rotateValue }],
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
