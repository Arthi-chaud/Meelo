import {
	type ComponentProps,
	Fragment,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { View, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
	cancelAnimation,
	clamp,
	useAnimatedReaction,
	useSharedValue,
	withDecay,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { CoverflowItem } from "./item";
import {
	convertDeceleration,
	convertSensitivity,
	type Deceleration,
	orderChildren,
	type Sensitivity,
} from "./utils";

type Props<T> = {
	sensitivity?: Sensitivity;
	deceleration?: Deceleration;
	initialSelection?: number;
	data: T[];
	renderItem: (item: T) => ReactNode;
	itemKey: (item: T) => string;
	config?: Partial<
		Omit<ComponentProps<typeof CoverflowItem>, "children" | "scroll">
	>;
	onPress?: (itemIdx: number) => void;
	onChange?: (scrollPos: number) => void;
	style?: ViewStyle;
};

import * as ScreenOrientation from "expo-screen-orientation";
import { runOnJS } from "react-native-worklets";
export const Coverflow = <T,>(props: Props<T>) => {
	useEffect(() => {
		ScreenOrientation.unlockAsync();
		return () => {
			ScreenOrientation.lockAsync(
				ScreenOrientation.OrientationLock.PORTRAIT_UP,
			);
		};
	}, []);
	const [width, setWidth] = useState(0);
	const sensitivity = useMemo(
		() => convertSensitivity(props.sensitivity ?? "normal"),
		[props.sensitivity],
	);
	const scrollX = useSharedValue(props.initialSelection ?? 0);
	const offsetX = useSharedValue(0);

	const onScroll = (value: number) => {
		scrollPos.current = value;

		const newSelection = clamp(Math.round(value), 0, childrenCount - 1);
		if (newSelection !== selection) {
			// NOTE: Guard is not necessary
			setSelection(newSelection);
		}
	};
	useAnimatedReaction(
		() => scrollX.value,
		(value, prev) => {
			if (value !== prev && value !== null) {
				runOnJS(onScroll)(value);
			}
		},
	);

	const snapToPosition = (pos?: number) => {
		pos ??= scrollPos.current;

		const finalPos = clamp(Math.round(pos), 0, childrenCount - 1);
		if (finalPos !== scrollPos.current) {
			props.onChange?.(finalPos);
			scrollX.value = withSpring(finalPos);
		}
	};
	const [selection, setSelection] = useState(props.initialSelection ?? 0);
	useEffect(() => {
		setSelection((oldSelection) => {
			const newSelection = clamp(oldSelection, 0, props.data.length - 1);
			if (newSelection !== oldSelection) {
				scrollX.value = newSelection;
			}
			return newSelection;
		});
	}, [props.data]);
	const scrollPos = useRef(props.initialSelection ?? 0);
	const childrenCount = useMemo(() => props.data.length, [props.data]);
	const orderedChildren = useMemo(
		() => orderChildren(props.data, selection),
		[props.data, selection],
	);
	const panResponder = Gesture.Pan()
		// Only start the pan responder when there is some movement
		.activeOffsetX([-10, 10])
		.onBegin(() => {
			cancelAnimation(scrollX);
			//TODO: Extract offset?
			offsetX.value = scrollX.value;
		})
		.onUpdate((event) => {
			scrollX.value = offsetX.value - event.translationX / sensitivity;
		})
		.onEnd((event) => {
			const selection = Math.round(scrollPos.current);
			if (
				selection > 0 &&
				selection < childrenCount - 2 &&
				Math.abs(event.velocityX) > 1
			) {
				const velocity =
					-Math.sign(event.velocityX) *
					(clamp(Math.abs(event.velocityX), 3, 5) / sensitivity);
				scrollX.value = withDecay(
					{
						velocity,
						deceleration: convertDeceleration(
							props.deceleration ?? "normal",
						),
					},
					(finished) => {
						if (finished) {
							runOnJS(snapToPosition)();
						}
					},
				);
			} else {
				runOnJS(snapToPosition)();
			}
		});

	const onSelect = (idx: number) => {
		// Check if the current selection is "exactly" the same
		if (idx === Math.round(scrollPos.current)) {
			props.onPress?.(idx);
		} else {
			snapToPosition(idx);
		}
	};
	const renderItem = ([position, item]: [number, T]) => {
		if (!width) {
			return null;
		}
		return (
			<CoverflowItem
				scroll={scrollX}
				position={position}
				spacing={props.config?.spacing ?? 100}
				wingSpan={props.config?.wingSpan ?? 80}
				rotation={props.config?.rotation ?? 50}
				midRotation={props.config?.midRotation ?? 50}
				perspective={props.config?.perspective ?? 800}
				scaleDown={props.config?.scaleDown ?? 0.8}
				scaleFurther={props.config?.scaleFurther ?? 0.75}
				onSelect={() => onSelect(position)}
			>
				{props.renderItem(item)}
			</CoverflowItem>
		);
	};
	return (
		<GestureDetector gesture={panResponder}>
			<View
				style={[styles.container, props.style]}
				{...props}
				onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
			>
				{orderedChildren.map((item) => (
					<Fragment key={props.itemKey(item[1])}>
						{renderItem(item)}
					</Fragment>
				))}
			</View>
		</GestureDetector>
	);
};

const styles = StyleSheet.create({
	container: {
		justifyContent: "center",
		alignItems: "center",
	},
});
