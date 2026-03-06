import { useNavigation } from "expo-router";
import type { RefObject } from "react";
import { Platform, Pressable, type View, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { BackIcon } from "@/ui/icons";
import { BlurView } from "~/components/blur-view";
import { Icon } from "~/primitives/icon";

export const BackButton = () => {
	const navigator = useNavigation();
	return (
		navigator.canGoBack() && (
			<Pressable
				style={styles.backButtonContainer}
				onPress={() => navigator.goBack()}
			>
				<Icon icon={BackIcon} />
			</Pressable>
		)
	);
};

export const HeaderBackground = ({
	blurTarget,
	style,
}: {
	blurTarget: RefObject<View | null>;
	style?: ViewStyle[];
}) => (
	<Animated.View style={[styles.headerBgContainer, style]}>
		<BlurView blurTarget={blurTarget} style={styles.headerBgContent} />
	</Animated.View>
);

const styles = StyleSheet.create((theme) => ({
	backButtonContainer: {
		// On Android, the title is right next to the back button, so we need spacing between the two
		// On iOS, the back button is in a LiquidGlass container (and the title isn't inside it), so we dont need that padding.
		// The padding is to align the icon in the center
		paddingRight: theme.gap(Platform.OS === "ios" ? 0.25 : 2),
		paddingLeft: 0,
	},
	headerBgContainer: {
		position: "absolute",
		height: "100%",
		width: "100%",
		overflow: "hidden",
		borderBottomLeftRadius: theme.borderRadius,
		borderBottomRightRadius: theme.borderRadius,
	},
	headerBgContent: {
		flex: 1,
	},
}));
