import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, {
	interpolate,
	type SharedValue,
	useAnimatedStyle,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

type Props = {
	spacing: number;
	position: number;
	wingSpan: number;
	rotation: number;
	midRotation: number;
	perspective: number;
	scaleDown: number;
	scaleFurther: number;
	onSelect: () => void;
	scroll: SharedValue<number>;
	children: ReactNode;
};

export const CoverflowItem = ({
	children,
	perspective,
	position,
	rotation,
	midRotation,
	scaleFurther,
	scaleDown,
	scroll,
	spacing,
	wingSpan,
	onSelect,
}: Props) => {
	const animatedStyle = useAnimatedStyle(() => {
		const rotateY = interpolate(
			scroll.value,
			[
				position - 2,
				position - 1,
				position - 0.5,
				position,
				position + 0.5,
				position + 1,
				position + 2,
			],
			[
				-rotation,
				-rotation,
				-midRotation,
				0,
				midRotation,
				rotation,
				rotation,
			],
		);
		return {
			transform: [
				{ perspective },
				{
					translateX: interpolate(
						scroll.value,
						[
							position - 2,
							position - 1,
							position,
							position + 1,
							position + 2,
						],
						[
							spacing + wingSpan,
							spacing,
							0,
							-spacing,
							-spacing - wingSpan,
						],
					),
				},
				{
					scale: interpolate(
						scroll.value,
						[
							position - 2,
							position - 1,
							position,
							position + 1,
							position + 2,
						],
						[scaleFurther, scaleDown, 1, scaleDown, scaleFurther],
					),
				},
				{
					rotateY: `${rotateY}deg`,
				},
			],
		};
	});
	return (
		<View style={styles.container}>
			<Pressable
				android_ripple={null}
				android_disableSound
				onPress={() => onSelect(position)}
			>
				<Animated.View style={animatedStyle}>{children}</Animated.View>
			</Pressable>
		</View>
	);
};
const styles = StyleSheet.create({
	container: {
		position: "absolute",
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
	},
});
