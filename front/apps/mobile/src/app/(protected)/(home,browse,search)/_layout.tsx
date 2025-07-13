import { BackIcon } from "@/ui/icons";
import { Stack, useNavigation } from "expo-router";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

export const unstable_settings = {
	home: {
		initialRouteName: "index",
	},
};

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
		navigator.canGoBack() && (
			<TouchableOpacity
				style={styles.backButtonContainer}
				onPress={() => navigator.goBack()}
			>
				<Icon />
			</TouchableOpacity>
		)
	);
};

const SharedRoutes: {
	name: string;
	options: { headerTitle: TranslationKey | null };
}[] = [
	{ name: "artists/index", options: { headerTitle: "models.artist_plural" } },
	{ name: "artists/[id]", options: { headerTitle: null } },
	{ name: "albums/index", options: { headerTitle: "models.album_plural" } },
	{ name: "songs/index", options: { headerTitle: "models.song_plural" } },
	{ name: "videos/index", options: { headerTitle: "models.video_plural" } },
];

export default function Layout({ segment }: { segment: string }) {
	const { t } = useTranslation();
	const screenOptions = {
		contentStyle: [styles.screen],
		headerStyle: styles.header,
		headerTitleStyle: styles.headerTitle,
		headerLeft: () => <BackButton />,
		headerTintColor: styles.headerTitle.color,
	};
	switch (segment) {
		case "(home)": {
			return (
				<Stack screenOptions={screenOptions}>
					<Stack.Screen
						name="index"
						options={{
							headerTitle: t("nav.home"),
						}}
					/>
					{SharedRoutes.map(
						(
							{ name, options: { headerTitle, ...options } },
							idx,
						) => (
							<Stack.Screen
								key={idx}
								name={name}
								options={{
									headerTitle: headerTitle
										? t(headerTitle)
										: "",
									...options,
								}}
							/>
						),
					)}
				</Stack>
			);
		}
		case "(browse)": {
			return (
				<Stack screenOptions={screenOptions}>
					<Stack.Screen
						name="index"
						options={{
							headerTitle: t("nav.browse"),
							// TODO IDK why we canGoBack when we are at the browse's index
							headerLeft: () => <View />,
						}}
					/>
					{SharedRoutes.map(
						(
							{ name, options: { headerTitle, ...options } },
							idx,
						) => (
							<Stack.Screen
								key={idx}
								name={name}
								options={{
									headerTitle: headerTitle
										? t(headerTitle)
										: "",
									...options,
								}}
							/>
						),
					)}
				</Stack>
			);
		}
		case "(search)": {
			return (
				<Stack screenOptions={screenOptions}>
					<Stack.Screen
						name="index"
						options={{
							headerTitle: t("nav.search"),
							// TODO IDK why we canGoBack when we are at the browse's index
							headerLeft: () => <View />,
						}}
					/>
					{SharedRoutes.map(
						(
							{ name, options: { headerTitle, ...options } },
							idx,
						) => (
							<Stack.Screen
								key={idx}
								name={name}
								options={{
									headerTitle: headerTitle
										? t(headerTitle)
										: "",
									...options,
								}}
							/>
						),
					)}
				</Stack>
			);
		}
	}
}
