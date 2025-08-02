import { Stack, useNavigation } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { BackIcon } from "@/ui/icons";
import { BlurView } from "~/components/blur-view";
import { Icon as MeeloIcon } from "~/components/meelo";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";

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
	icon: { marginRight: theme.gap(2) },
	backButtonContainer: { paddingRight: theme.gap(2), paddingLeft: 0 },
	headerTitle: {
		color: theme.colors.text.primary,
		...theme.fontStyles.regular,
	},
}));

const BackButton = () => {
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

const SharedRoutes: {
	name: string;
	options: { headerTitle: TranslationKey | null };
}[] = [
	{ name: "artists/index", options: { headerTitle: "models.artist_plural" } },
	{ name: "artists/[id]", options: { headerTitle: null } },
	{ name: "albums/index", options: { headerTitle: "models.album_plural" } },
	{ name: "songs/index", options: { headerTitle: "models.song_plural" } },
	{ name: "videos/index", options: { headerTitle: "models.video_plural" } },
	{ name: "tracks/index", options: { headerTitle: "models.track_plural" } },
	{ name: "songs/[id]", options: { headerTitle: null } },
	{ name: "releases/[id]", options: { headerTitle: null } },
];

export default function Layout({ segment }: { segment: string }) {
	const { t } = useTranslation();
	// Cant memo-ise this, we need this to be updated when theme changes
	const screenOptions = {
		contentStyle: [styles.screen],
		// headerStyle: styles.header,
		headerTitleStyle: styles.headerTitle,
		headerLeft: () => <BackButton />,
		headerBackground: () => (
			<View style={styles.headerBgContainer}>
				<BlurView style={styles.headerBgContent} />
			</View>
		),
		headerTransparent: true,
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
							headerLeft: () => <MeeloIcon style={styles.icon} />,
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
