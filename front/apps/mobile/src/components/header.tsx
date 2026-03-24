import { useScrollToTop } from "@react-navigation/native";
import type { FlashListRef } from "@shopify/flash-list";
import { BlurTargetView } from "expo-blur";
import { type ScreenProps, Stack } from "expo-router";
import { type ReactNode, type Ref, type RefObject, useRef } from "react";
import { Platform } from "react-native";
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
	scrollRef: Ref<FlashListRef<any>>;
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
	const scrollRef = useRef<FlashListRef<any>>(null);
	const showHeader = Platform.OS !== "ios";

	return (
		<>
			<Stack.Screen
				options={{
					headerBackground: showHeader
						? () => (
								<HeaderBackground
									blurTarget={blurRef}
									style={[{ opacity: 0 }, headerStyle]}
								/>
							)
						: () => null,
					...options,
				}}
			/>
			<BlurTargetView ref={blurRef} style={{ flex: 1 }}>
				{children({
					scrollRef,
					onScroll: scrollHandler,
					scrollEventThrottle: 16,
				})}
			</BlurTargetView>
		</>
	);
};

export const StaticHeader = ({
	children,
	options,
}: {
	children:
		| ReactNode
		| ((scrollRef: RefObject<FlashListRef<any> | null>) => ReactNode);
	options?: ScreenProps["options"];
}) => {
	const contentRef = useRef(null);
	const scrollRef = useRef<FlashListRef<any>>(null);

	useScrollToTop(
		useRef({
			scrollToTop: () =>
				scrollRef?.current?.scrollToTop({ animated: true }),
		}),
	);
	return (
		<Stack.Screen
			options={{
				headerBackground: () => (
					<HeaderBackground blurTarget={contentRef} />
				),
				...options,
			}}
		>
			<BlurTargetView style={{ flex: 1 }} ref={contentRef}>
				{typeof children === "function"
					? children(scrollRef)
					: children}
			</BlurTargetView>
		</Stack.Screen>
	);
};
