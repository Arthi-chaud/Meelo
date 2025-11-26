import { type Href, useRouter } from "expo-router";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	AlbumIcon,
	ArtistIcon,
	CompilationIcon,
	GenreIcon,
	type Icon,
	PlaylistIcon,
	SongIcon,
	VideoIcon,
} from "@/ui/icons";
import { ListItem } from "~/components/item/list-item";
import { SafeView } from "~/components/safe-view";
import { Divider } from "~/primitives/divider";
import { Icon as IconComponent } from "~/primitives/icon";

const tabs: { title: TranslationKey; href: Href; icon: Icon }[] = [
	{
		title: "models.artist_plural",
		href: "/(protected)/(nav)/(browse)/artists",
		icon: ArtistIcon,
	},
	{
		title: "models.album_plural",
		href: "/(protected)/(nav)/(browse)/albums",
		icon: AlbumIcon,
	},

	{
		title: "models.song_plural",
		href: "/(protected)/(nav)/(browse)/songs",
		icon: SongIcon,
	},

	{
		title: "models.video_plural",
		href: "/(protected)/(nav)/(browse)/videos",
		icon: VideoIcon,
	},
	{
		title: "nav.compilations",
		href: "/(protected)/(nav)/(browse)/albums?compilations=true",
		icon: CompilationIcon,
	},

	{
		title: "models.playlist_plural",
		href: "/(protected)/(nav)/(browse)/playlists",
		icon: PlaylistIcon,
	},

	{
		title: "models.genre_plural",
		href: "/(protected)/(nav)/(browse)/genres",
		icon: GenreIcon,
	},
];

export default function BrowseList() {
	const router = useRouter();
	const { t } = useTranslation();
	return (
		<SafeView style={[styles.root]}>
			{tabs.map(({ title, href, icon }) => (
				<Fragment key={title}>
					<ListItem
						leading={
							<View style={styles.icon}>
								<IconComponent icon={icon} />
							</View>
						}
						title={t(title)}
						subtitle={null}
						onPress={() => router.navigate(href)}
					/>
					<Divider h withInsets />
				</Fragment>
			))}
		</SafeView>
	);
}

const styles = StyleSheet.create((theme) => ({
	root: {
		padding: theme.gap(0.5),
		display: "flex",
		height: "100%",
		alignItems: "flex-start",
		justifyContent: "flex-start",
	},
	icon: {
		height: "100%",
		backgroundColor: theme.colors.skeleton,
		borderRadius: theme.borderRadius,
		justifyContent: "center",
		alignItems: "center",
	},
}));
