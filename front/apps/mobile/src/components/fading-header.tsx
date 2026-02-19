import { Stack } from "expo-router";
import type { ReactNode } from "react";
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
}: {
	children: (props: PageScrollProps) => ReactNode;
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

	return (
		<>
			<Stack.Screen
				options={{
					headerBackground: () => (
						<HeaderBackground
							style={[{ opacity: 0 }, headerStyle]}
						/>
					),
				}}
			/>
			{children({ onScroll: scrollHandler, scrollEventThrottle: 16 })}
		</>
	);
};
