import { Stack } from "expo-router";
import { StyleSheet } from "react-native-unistyles";

const styles = StyleSheet.create((theme) => ({
	screen: { backgroundColor: theme.colors.background, flex: 1 },
}));

export default function BrowseLayout() {
	return (
		<Stack
			screenOptions={{ headerShown: false, contentStyle: styles.screen }}
		/>
	);
}
