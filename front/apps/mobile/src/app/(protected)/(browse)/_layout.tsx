import { BackIcon } from "@/ui/icons";
import { Stack, useNavigation } from "expo-router";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

const styles = StyleSheet.create((theme) => ({
	screen: {
		backgroundColor: "transparent",
		flex: 1,
	},
	header: {
		backgroundColor: theme.colors.background,
	},
	backButtonContainer: { paddingRight: theme.gap(2) },
	headerTitle: {
		color: theme.colors.text.primary,
		...theme.fontStyles.regular,
	},
}));

const BackButton = () => {
	const navigator = useNavigation();
	const Icon = withUnistyles(BackIcon, (theme) => ({
		color: theme.colors.text.primary,
	}));
	return (
		<TouchableOpacity
			style={styles.backButtonContainer}
			onPress={() => navigator.goBack()}
		>
			<Icon />
		</TouchableOpacity>
	);
};

export default function BrowseLayout() {
	const { t } = useTranslation();
	return (
		<Stack
			screenOptions={{
				contentStyle: [styles.screen],
				headerStyle: styles.header,
				headerTitleStyle: styles.headerTitle,
				headerLeft: () => <BackButton />,
				headerTintColor: styles.headerTitle.color,
			}}
		>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen
				name="artists"
				options={{ headerTitle: t("models.artist_plural") }}
			/>
			<Stack.Screen
				name="albums"
				options={{ headerTitle: t("models.album_plural") }}
			/>
		</Stack>
	);
}
