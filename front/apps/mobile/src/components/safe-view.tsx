import { FlashList, type FlashListProps } from "@shopify/flash-list";
import {
	ScrollView,
	type ScrollViewProps,
	View,
	type ViewProps,
	type ViewStyle,
} from "react-native";

import { useRootViewStyle } from "~/hooks/root-view-style";

export const SafeFlashList = <T,>(
	props: Omit<FlashListProps<T>, "contentContainerStyle"> & {
		contentContainerStyle?: ViewStyle[];
	},
) => {
	const { paddingTop, ...rootStyle } = useRootViewStyle();
	return (
		<FlashList
			{...props}
			contentContainerStyle={[
				...(props.contentContainerStyle ?? []),
				rootStyle,
				{
					paddingTop: mergePaddingTop(
						paddingTop,
						props.contentContainerStyle,
					),
				},
			]}
		/>
	);
};

// ScrollView that adds padding at the top and bottom to avoid header + tabbar
export const SafeScrollView = (
	props: Omit<ScrollViewProps, "contentContainerStyle"> & {
		contentContainerStyle?: ViewStyle[];
	},
) => {
	const { paddingTop, ...rootStyle } = useRootViewStyle();
	return (
		<ScrollView
			{...props}
			contentContainerStyle={[
				...(props.contentContainerStyle ?? []),
				rootStyle,
				{
					paddingTop: mergePaddingTop(
						paddingTop,
						props.contentContainerStyle,
					),
				},
			]}
		/>
	);
};

// View that adds padding at the top and bottom to avoid header + tabbar
export const SafeView = (
	props: Omit<ViewProps, "style"> & {
		style?: ViewStyle[];
	},
) => {
	const { paddingTop, ...rootStyle } = useRootViewStyle();
	return (
		<View
			{...props}
			style={[
				...(props.style ?? []),
				rootStyle,
				{
					paddingTop: mergePaddingTop(paddingTop, props.style),
				},
			]}
		/>
	);
};

const mergePaddingTop = (
	paddingTop: number,
	styles: ViewStyle[] | undefined,
) => {
	return (
		paddingTop +
		(styles
			?.map(
				(s) =>
					((s.padding ??
						s.paddingVertical ??
						s.paddingTop) as number) || 0,
			)
			?.reduce((p, s) => p + s) ?? 0)
	);
};
