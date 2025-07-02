import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";

const styles = StyleSheet.create((theme) => ({
	screen: {
		backgroundColor: theme.colors.background,
		flex: 1,
	},
}));

export default function BrowseLayout() {
	const { t } = useTranslation();
	return (
		<Stack screenOptions={{ contentStyle: [styles.screen] }}>
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
