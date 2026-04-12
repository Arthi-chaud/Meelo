import type { Stack } from "expo-router";
import type { ComponentProps } from "react";
import { Platform } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { BackButton } from "~/components/navigation";

export const useScreenOptions = () => {
	const { theme } = useUnistyles();
	const styles = {
		screen: {
			backgroundColor: "transparent",
			flex: 1,
		},
		icon: { marginRight: theme.gap(2) },
		headerTitle: {
			color: theme.colors.text.primary,
			...theme.fontStyles.regular,
		},
	};
	return {
		animation: Platform.OS === "android" ? "fade" : "default",
		animationTypeForReplace: "pop",
		freezeOnBlur: true,
		contentStyle: [styles.screen],
		headerTitleStyle: styles.headerTitle,
		headerLeft: () => <BackButton />,
		headerBackButtonDisplayMode: "minimal",
		headerTransparent: true,
		headerTintColor: styles.headerTitle.color,
	} satisfies ComponentProps<typeof Stack>["screenOptions"];
};
