import { Stack } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Icon as MeeloIcon } from "~/components/meelo";
import { useScreenOptions } from "~/utils/screen-options";

export const unstable_settings = {
	home: {
		initialRouteName: "index",
	},
};

const SharedRoutes: {
	name: string;
	options: { headerTitle: TranslationKey | null };
}[] = [
	{ name: "artists/index", options: { headerTitle: "models.artist_plural" } },
	{ name: "artists/[id]", options: { headerTitle: null } },
	{ name: "albums/index", options: { headerTitle: "models.album_plural" } },
	{ name: "songs/index", options: { headerTitle: "models.song_plural" } },
	{ name: "genres", options: { headerTitle: "models.genre_plural" } },
	{ name: "videos/index", options: { headerTitle: "models.video_plural" } },
	{ name: "tracks/index", options: { headerTitle: "models.track_plural" } },
	{
		name: "playlists/index",
		options: { headerTitle: "models.playlist_plural" },
	},

	{ name: "playlists/[id]", options: { headerTitle: null } },
	{ name: "songs/[id]", options: { headerTitle: null } },
	{ name: "releases/[id]", options: { headerTitle: null } },
];

export default function Layout({ segment }: { segment: string }) {
	const { t } = useTranslation();
	const screenOptions = useScreenOptions();
	const screenProps = useMemo(() => {
		switch (segment) {
			case "(home)": {
				return {
					options: {
						headerTitle: t("nav.home"),
						headerLeft:
							Platform.OS !== "ios"
								? () => <MeeloIcon style={styles.icon} />
								: undefined,
					},
				};
			}
			case "(browse)": {
				return {
					options: {
						headerTitle: t("nav.browse"),
						// TODO IDK why we canGoBack when we are at the browse's index
						headerLeft: () => <View />,
					},
				};
			}
			case "(search)": {
				return {
					options: {
						headerTitle: t("nav.search"),
						// TODO IDK why we canGoBack when we are at the browse's index
						headerLeft: () => <View />,
					},
				};
			}
		}
	}, [segment]);
	return (
		<Stack screenOptions={screenOptions}>
			<Stack.Screen name="index" {...screenProps} />
			{SharedRoutes.map(
				({ name, options: { headerTitle, ...options } }, idx) => (
					<Stack.Screen
						key={idx}
						name={name}
						options={{
							headerTitle: headerTitle ? t(headerTitle) : "",
							...options,
						}}
					/>
				),
			)}
		</Stack>
	);
}

const styles = StyleSheet.create((theme) => ({
	screen: {
		backgroundColor: "transparent",
		flex: 1,
	},
	icon: { marginRight: theme.gap(2) },
	headerTitle: {
		color: theme.colors.text.primary,
		...theme.fontStyles.regular,
	},
}));
