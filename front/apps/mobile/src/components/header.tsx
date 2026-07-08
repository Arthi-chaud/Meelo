import type { FlashListRef } from "@shopify/flash-list";
import { BlurTargetView } from "expo-blur";
import { type ScreenProps, Stack, useScrollToTop } from "expo-router";
import {
	type ComponentProps,
	type ReactNode,
	type Ref,
	type RefObject,
	useRef,
} from "react";
import { Platform } from "react-native";
import {
	interpolate,
	type ScrollHandlerProcessed,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { useUnistyles } from "react-native-unistyles";
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

export const useIosLargeTitle = () => {
	const { theme } = useUnistyles();
	return {
		screenOptions: {
			headerLargeTitleEnabled: Platform.OS === "ios",
			headerLargeTitleStyle:
				Platform.OS === "ios" ? theme.fontStyles.medium : undefined,
			headerBlurEffect: // NOTE: https://amanhimself.dev/blog/large-header-title-in-expo-router/
				Platform.OS === "ios" && parseInt(Platform.Version, 10) < 26
					? ("regular" as const)
					: undefined,
		},
		flashlistOptions: {
			contentInsetAdjustmentBehavior:
				Platform.OS === "ios"
					? ("automatic" as const)
					: ("never" as const),
		},
	};
};

export const StaticHeader = ({
	children,
	options,
}: {
	children:
		| ReactNode
		| ((scrollRef: RefObject<FlashListRef<any> | null>) => ReactNode);
	options?: ComponentProps<typeof Stack.Screen>["options"];
}) => {
	const contentRef = useRef(null);
	const scrollRef = useRef<FlashListRef<any>>(null);
	const { theme } = useUnistyles();

	useScrollToTop(
		useRef({
			scrollToTop: () =>
				scrollRef?.current?.scrollToTop({ animated: true }),
		}),
	);
	return (
		<Stack.Screen
			options={{
				headerTitleStyle: theme.fontStyles.regular,
				headerBackground:
					// @ts-expect-error
					options?.headerLargeTitleEnabled ||
					// @ts-expect-error
					options?.headerLargeTitle
						? undefined
						: () => <HeaderBackground blurTarget={contentRef} />,
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
