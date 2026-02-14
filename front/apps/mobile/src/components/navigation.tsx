import { useNavigation } from "expo-router";
import { Pressable, type ViewStyle } from "react-native";
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

export const HeaderBackground = ({ style }: { style?: ViewStyle[] }) => (
	<Animated.View style={[styles.headerBgContainer, style]}>
		<BlurView style={styles.headerBgContent} />
	</Animated.View>
);

const styles = StyleSheet.create((theme) => ({
	backButtonContainer: { paddingRight: theme.gap(2), paddingLeft: 0 },
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
