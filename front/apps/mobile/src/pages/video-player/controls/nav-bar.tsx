import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { BackIcon } from "@/ui/icons";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";

type Props = { style: ViewStyle };

export const NavigationBar = ({ style }: Props) => {
	const router = useRouter();
	return (
		<LinearGradient
			style={[styles.root, style]}
			colors={["black", "transparent"]}
		>
			<Pressable onPress={() => router.back()}>
				<Icon icon={BackIcon} style={{ color: "white" }} />
			</Pressable>
		</LinearGradient>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		width: "100%",
		padding: theme.gap(2),
		flexDirection: "row",
		justifyContent: "flex-start",
	},
}));
