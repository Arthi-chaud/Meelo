/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { getAlbums, getArtists, getReleases, getSongs } from "@/api/queries";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useInfiniteQuery } from "~/api";
import { useSetKeyIllustrationFromInfiniteQuery } from "~/components/background-gradient";
import { InfiniteRow } from "~/components/infinite/row";
import { SongGrid } from "~/components/song-grid";
import { AlbumTile } from "~/components/tile/resource/album";
import { ArtistTile } from "~/components/tile/resource/artist";
import ReleaseTile from "~/components/tile/resource/release";
import { useRootViewStyle } from "~/hooks/root-view-style";
import { Text } from "~/primitives/text";

const styles = StyleSheet.create((theme) => ({
	main: {},
	section: {
		paddingBottom: theme.gap(2),
	},
	title: { paddingLeft: theme.gap(2) },
}));

//TODO header on scroll

const newlyAddedAlbums = getAlbums({}, { sortBy: "addDate", order: "desc" }, [
	"illustration",
	"artist",
]);

const newlyAddedArtists = getArtists({}, { sortBy: "addDate", order: "desc" }, [
	"illustration",
]);

const latestAlbums = getAlbums({}, { sortBy: "releaseDate", order: "desc" }, [
	"illustration",
	"artist",
]);

const newlyAddedReleases = getReleases(
	{},
	{ sortBy: "addDate", order: "desc" },
	["illustration"],
);

export default function Root() {
	const rootStyle = useRootViewStyle();
	const { t } = useTranslation();
	useSetKeyIllustrationFromInfiniteQuery(newlyAddedAlbums);

	const topSongs = useInfiniteQuery(() =>
		getSongs({}, { sortBy: "userPlayCount", order: "desc" }, [
			"artist",
			"featuring",
			"master",
			"illustration",
		]),
	);
	return (
		<ScrollView style={[styles.main]} contentContainerStyle={rootStyle}>
			<Text content={t("nav.home")} style={styles.title} variant="h2" />
			<InfiniteRow
				style={styles.section}
				header={t("home.newlyAddedAlbums")}
				query={newlyAddedAlbums}
				render={(album) => {
					return <AlbumTile album={album} />;
				}}
			/>

			<InfiniteRow
				style={styles.section}
				header={t("home.newlyAddedArtists")}
				query={newlyAddedArtists}
				render={(artist) => {
					return <ArtistTile artist={artist} />;
				}}
			/>
			{/* TODO Featured albums */}

			<InfiniteRow
				style={styles.section}
				header={t("home.latestAlbums")}
				query={latestAlbums}
				render={(album) => {
					return <AlbumTile album={album} />;
				}}
			/>

			<InfiniteRow
				style={styles.section}
				header={t("home.newlyAddedReleases")}
				query={newlyAddedReleases}
				render={(release) => {
					return <ReleaseTile release={release} />;
				}}
			/>

			{/* TODO Genres*/}

			<SongGrid
				header={t("home.mostPlayedSongs")}
				songs={topSongs.data?.pages.at(0)?.items}
				subtitle={() => "artists"}
				style={styles.section}
			/>
		</ScrollView>
	);
}
