import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useScreenOptions } from "~/utils/screen-options";

export default function Layout() {
	const { t } = useTranslation();
	const screenOptions = useScreenOptions();
	return (
		<Stack screenOptions={screenOptions}>
			<Stack.Screen
				name="index"
				options={{
					headerTitle: t("nav.settings"),
					// TODO IDK why we canGoBack when we are at the index
					headerLeft: () => <View />,
				}}
			/>
		</Stack>
	);
}
