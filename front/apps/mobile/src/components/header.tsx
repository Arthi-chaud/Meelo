import { BlurTargetView } from "expo-blur";
import { type ScreenProps, Stack } from "expo-router";
import { type ReactNode, useRef } from "react";
import {
	interpolate,
	type ScrollHandlerProcessed,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { HeaderBackground } from "./navigation";

export type ScrollHandler = ScrollHandlerProcessed<Record<string, unknown>>;

export type PageScrollProps = {
	onScroll: ScrollHandler;
	scrollEventThrottle: number;
};

// To be used only on top-level, screen components
export const FadingHeader = ({
	children,
	options,
}: {
	children: (props: PageScrollProps) => ReactNode;
	options?: ScreenProps["options"];
}) => {
	const scrollY = useSharedValue(0);
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y;
		},
	});
	const headerStyle = useAnimatedStyle(
		() => ({
			opacity: interpolate(scrollY.value, [30, 100], [0, 1], {
				extrapolateLeft: "clamp",
			}),
		}),
		[],
	);
	const blurRef = useRef(null);

	return (
		<>
			<Stack.Screen
				options={{
					headerBackground: () => (
						<HeaderBackground
							blurTarget={blurRef}
							style={[{ opacity: 0 }, headerStyle]}
						/>
					),
					...options,
				}}
			/>
			<BlurTargetView ref={blurRef} style={{ flex: 1 }}>
				{children({ onScroll: scrollHandler, scrollEventThrottle: 16 })}
			</BlurTargetView>
		</>
	);
};

export const StaticHeader = ({
	children,
	options,
}: {
	children: any;
	options?: ScreenProps["options"];
}) => {
	const r = useRef(null);
	return (
		<Stack.Screen
			options={{
				headerBackground: () => <HeaderBackground blurTarget={r} />,
				...options,
			}}
		>
			<BlurTargetView style={{ flex: 1 }} ref={r}>
				{children}
			</BlurTargetView>
		</Stack.Screen>
	);
};
