import { type Href, useRouter } from "expo-router";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
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

const tabs: { title: TranslationKey; href: Href; icon: Icon }[] = [
	{
		title: "models.artist_plural",
		href: "/(protected)/(browse)/artists",
		icon: ArtistIcon,
	},
	{
		title: "models.album_plural",
		href: "/(protected)/(browse)/albums",
		icon: AlbumIcon,
	},

	{
		title: "models.song_plural",
		href: "/(protected)/(browse)/songs",
		icon: SongIcon,
	},

	{
		title: "models.video_plural",
		href: "/(protected)/(browse)/videos",
		icon: VideoIcon,
	},
	{
		title: "nav.compilations",
		href: "/(protected)/(browse)/albums?compilations=true",
		icon: CompilationIcon,
	},

	{
		title: "models.playlist_plural",
		href: "/(protected)/(browse)/playlists",
		icon: PlaylistIcon,
	},

	{
		title: "models.genre_plural",
		href: "/(protected)/(browse)/genres",
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
						illustration={null}
						illustrationProps={{ fallbackIcon: icon }}
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
}));
