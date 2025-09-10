import {
	Children,
	type ComponentProps,
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	type LayoutChangeEvent,
	PanResponder,
	type PanResponderInstance,
	TouchableWithoutFeedback,
	View,
	type ViewStyle,
} from "react-native";
import Animated, {
	cancelAnimation,
	clamp,
	interpolate,
	runOnJS,
	type SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withDecay,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { getRandomNumber } from "@/utils/random";

export enum Sentivity {
	Low = "low",
	High = "high",
	Normal = "normal",
}

// The deceleration values as used by iOS UIScrollView
export enum Deceleration {
	Fast = 0.99,
	Normal = 0.994,
}

const fixChildrenOrder = (
	props: ComponentProps<typeof View>,
	selection: number,
) => {
	const source = Children.toArray(props.children);

	const children = [];

	// First the children before selection
	for (let i = 0; i < selection; i += 1) {
		children.push([i, source[i]]);
	}

	// Next the children after selection in reverse order
	for (let i = source.length - 1; i > selection; i -= 1) {
		children.push([i, source[i]]);
	}

	// Finally the selection at the top
	children.push([selection, source[selection]]);

	return children;
};

const convertSensitivity = (sensitivity: Sentivity) => {
	switch (sensitivity) {
		case Sentivity.Low:
			return 120;
		case Sentivity.High:
			return 40;
		case Sentivity.Normal:
		default:
			return 60;
	}
};

// const clamp = (value: number, min: number, max: number) => {
// 	if (value < min) {
// 		return min;
// 	}
// 	if (value > max) {
// 		return max;
// 	}
// 	return value;
// };

const styles = StyleSheet.create({
	itemContainer: {
		position: "absolute",
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
	},
	parentContainer: {
		justifyContent: "center",
		alignItems: "center",
	},
});

type ItemProps = {
	scroll: SharedValue<number>;
	position: number;
	children: ReactNode;
	wingSpan: number;
	spacing: number;
	rotation: number;
	midRotation: number;
	perspective: number;
	scaleDown: number;
	scaleFurther: number;
	onSelect: (position: number) => void;
};

export const Item = ({
	children,
	scroll,
	position,
	rotation,
	midRotation,
	perspective,
	scaleDown,
	scaleFurther,
	wingSpan,
	spacing,
	onSelect,
}: ItemProps) => {
	// TODO
	// static childContextTypes = {
	//   animatedPosition: PropTypes.instanceOf(Animated.Interpolation),
	// };
	//
	// getChildContext() {
	//   const { scroll, position } = this.props;
	//   return {
	//     animatedPosition: scroll.interpolate({
	//       inputRange: [position - 2, position - 1, position, position + 1, position + 2],
	//       outputRange: [-1, -1, 0, 1, 1],
	//     }),
	//   };
	// }
	const style = useAnimatedStyle(
		() => ({
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
					rotateY: `${interpolate(
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
					)}deg`,
				},
			],
		}),
		[],
	);
	return (
		<View pointerEvents="box-none" style={styles.itemContainer}>
			<TouchableWithoutFeedback onPress={() => onSelect(position)}>
				<Animated.View style={style}>{children}</Animated.View>
			</TouchableWithoutFeedback>
		</View>
	);
};

type CoverflowProps = {
	sensitivity?: Sentivity;
	deceleration: Deceleration;
	initialSelection: number;
	spacing: number;
	wingSpan: number;
	rotation: number;
	midRotation: number;
	perspective: number;
	scaleDown: number;
	scaleFurther: number;
	children: ReactNode[];
	style?: ViewStyle;
	onPress: (index: number) => void;
	onChange: (position: number) => void;
};

export const Coverflow = (props: CoverflowProps) => {
	const scrollX = useSharedValue(props.initialSelection);
	const scrollPos = useRef(props.initialSelection);
	const [state, setState] = useState({
		width: 0,
		sensitivity: props.sensitivity,
		selection: props.initialSelection,
		children: fixChildrenOrder(props, props.initialSelection),
	});
	const [panResponder, setPanResponder] = useState<PanResponderInstance>();

	const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
		setState((obj) => ({
			...obj,
			width: nativeEvent.layout.width,
		}));
	}, []);

	const onScroll = useCallback(
		(value: number) => {
			scrollPos.current = value;
			const count = state.children.length;
			const newSelection = clamp(Math.round(value), 0, count - 1);
			if (newSelection !== state.selection) {
				setState((obj) => ({
					...obj,
					selection: newSelection,
					children: fixChildrenOrder(props, newSelection),
				}));
			}
		},
		[state],
	);

	const snapToPosition = useCallback(
		(pos?: number) => {
			const pos_ = pos ?? scrollPos.current;
			const count = Children.count(state.children);
			const finalPos = clamp(Math.round(pos_), 0, count - 1);
			if (finalPos !== scrollPos.current) {
				props.onChange(finalPos);
				scrollX.value = withSpring(finalPos);
			}
		},
		[state],
	);
	const onSelect = useCallback(
		(idx: number) => {
			if (idx === Math.round(scrollPos.current)) {
				props.onPress?.(idx);
			} else {
				snapToPosition(idx);
			}
		},
		[snapToPosition],
	);
	const renderItem = useCallback(
		(position: number, item: any) => {
			if (!state.width) {
				return null;
			}
			const {
				rotation,
				midRotation,
				perspective,
				scaleDown,
				scaleFurther,
				spacing,
				wingSpan,
			} = props;
			return (
				<Item
					key={item.key}
					scroll={scrollX}
					position={position}
					spacing={spacing}
					wingSpan={wingSpan}
					rotation={rotation}
					midRotation={midRotation}
					perspective={perspective}
					scaleDown={scaleDown}
					scaleFurther={scaleFurther}
					onSelect={onSelect}
				>
					{item}
				</Item>
			);
		},
		[state, props, onSelect],
	);
	useAnimatedReaction(() => scrollX.value, () => {
		runOnJS(onScroll)(scrollX.value);
	}, [state]);
	useEffect(() => {
		const sensitivityInt = convertSensitivity(
			props.sensitivity ?? Sentivity.Normal,
		);

		setPanResponder(
			PanResponder.create({
				onStartShouldSetPanResponder: () => true,
				onMoveShouldSetPanResponder: (_evt, gestureState) =>
					Math.abs(gestureState.dx) > 10,
				onPanResponderGrant: () => {
					cancelAnimation(scrollX);
					//TODO
					// scrollX.extractOffset();
				},
				onPanResponderTerminationRequest: () => true,
				onPanResponderMove: (evt, gestureState) => {
					//TODO
					scrollX.set(-(gestureState.dx / sensitivityInt));
				},
				onPanResponderRelease: (evt, gestureState) => {
					scrollX.value = withSpring(Math.round(scrollX.value));
					//TODO
					// scrollX.flattenOffset();

					const count = Children.count(props.children);
					const selection = Math.round(scrollPos.current);

					// Damp out the scroll with certain deceleration
					if (
						selection > 0 &&
						selection < count - 2 &&
						Math.abs(gestureState.vx) > 1
					) {
						const velocity =
							-Math.sign(gestureState.vx) *
							(clamp(Math.abs(gestureState.vx), 3, 5) /
								sensitivityInt);
						const deceleration = props.deceleration;

						scrollX.value = withDecay(
							{ velocity, deceleration },
							() => {
								runOnJS(snapToPosition)();
							},
						);
					} else {
						snapToPosition();
					}
				},
			}),
		);
	}, [props]);
	return (
		<View
			style={[styles.parentContainer, props.style]}
			{...props}
			onLayout={onLayout}
			{...panResponder?.panHandlers}
		>
			{props.children?.map((item, idx) => renderItem(idx, item))}
		</View>
	);
};
