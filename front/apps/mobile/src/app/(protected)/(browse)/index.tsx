import {
	AlbumIcon,
	ArtistIcon,
	CompilationIcon,
	type Icon,
	SongIcon,
	VideoIcon,
} from "@/ui/icons";
import { type Href, useRouter } from "expo-router";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ListItem } from "~/components/list-item";
import { useRootViewStyle } from "~/hooks/root-view-style";
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
];

export default function BrowseList() {
	const router = useRouter();
	const { t } = useTranslation();
	const rootStyle = useRootViewStyle();
	return (
		<View style={[rootStyle, styles.root]}>
			{tabs.map(({ title, href, icon }) => (
				<Fragment key={title}>
					<ListItem
						illustration={null}
						illustrationProps={{ fallbackIcon: icon }}
						title={t(title)}
						subtitle={null}
						onPress={() => router.push(href)}
					/>
					<Divider h withInsets />
				</Fragment>
			))}
		</View>
	);
}

const styles = StyleSheet.create(() => ({
	root: {
		display: "flex",
		height: "100%",
		alignItems: "flex-start",
		justifyContent: "flex-start",
	},
}));
