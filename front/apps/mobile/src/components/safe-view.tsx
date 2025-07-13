import {
	ScrollView,
	type ScrollViewProps,
	View,
	type ViewProps,
	type ViewStyle,
} from "react-native";

import { useRootViewStyle } from "~/hooks/root-view-style";

// ScrollView that adds padding at the top and bottom to avoid header + tabbar
export const SafeScrollView = (
	props: Omit<ScrollViewProps, "contentContainerStyle"> & {
		contentContainerStyle?: ViewStyle[];
	},
) => {
	const rootStyle = useRootViewStyle();
	return (
		<ScrollView
			{...props}
			contentContainerStyle={[
				rootStyle,
				...(props.contentContainerStyle ?? []),
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
	const rootStyle = useRootViewStyle();
	return <View {...props} style={[rootStyle, ...(props.style ?? [])]} />;
};
