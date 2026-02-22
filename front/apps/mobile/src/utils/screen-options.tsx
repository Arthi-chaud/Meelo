import type { Stack } from "expo-router";
import type { ComponentProps } from "react";
import { useUnistyles } from "react-native-unistyles";
import { BackButton, HeaderBackground } from "~/components/navigation";

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
		animation: "none", //TODO slide_from_right without flicker
		animationTypeForReplace: "pop",
		freezeOnBlur: true,
		contentStyle: [styles.screen],
		// headerStyle: styles.header,
		headerTitleStyle: styles.headerTitle,
		headerLeft: () => <BackButton />,
		headerBackground: () => <HeaderBackground />,
		headerTransparent: true,
		headerTintColor: styles.headerTitle.color,
	} satisfies ComponentProps<typeof Stack>["screenOptions"];
};
