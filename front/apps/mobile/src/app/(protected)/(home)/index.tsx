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
import { useSetKeyIllustration } from "~/components/background-gradient";
import { Row } from "~/components/row";
import { SongGrid } from "~/components/song-grid";
import { AlbumTile } from "~/components/tile/resource/album";
import { ArtistTile } from "~/components/tile/resource/artist";
import ReleaseTile from "~/components/tile/resource/release";

const styles = StyleSheet.create((theme) => ({
	main: { paddingTop: theme.gap(2) },
	section: {
		paddingBottom: theme.gap(2),
	},
	title: { paddingLeft: theme.gap(2) },
}));

//TODO header on scroll

export default function Root() {
	const { t } = useTranslation();
	const newlyAddedAlbums = useInfiniteQuery(() =>
		getAlbums({}, { sortBy: "addDate", order: "desc" }, [
			"illustration",
			"artist",
		]),
	);
	const newlyAddedArtists = useInfiniteQuery(() =>
		getArtists({}, { sortBy: "addDate", order: "desc" }, ["illustration"]),
	);

	const latestAlbums = useInfiniteQuery(() =>
		getAlbums({}, { sortBy: "releaseDate", order: "desc" }, [
			"illustration",
			"artist",
		]),
	);

	const newlyAddedReleases = useInfiniteQuery(() =>
		getReleases({}, { sortBy: "addDate", order: "desc" }, ["illustration"]),
	);
	useSetKeyIllustration(newlyAddedAlbums.items?.at(0));
	const topSongs = useInfiniteQuery(() =>
		getSongs({}, { sortBy: "userPlayCount", order: "desc" }, [
			"artist",
			"featuring",
			"master",
			"illustration",
		]),
	);
	return (
		<ScrollView contentContainerStyle={[styles.main]}>
			<Row
				style={styles.section}
				header={t("home.newlyAddedAlbums")}
				items={newlyAddedAlbums.items}
				render={(album) => {
					return <AlbumTile album={album} subtitle="artistName" />;
				}}
			/>

			<Row
				style={styles.section}
				header={t("home.newlyAddedArtists")}
				items={newlyAddedArtists.items}
				render={(artist) => {
					return <ArtistTile artist={artist} />;
				}}
			/>
			{/* TODO Featured albums */}

			<Row
				style={styles.section}
				header={t("home.latestAlbums")}
				items={latestAlbums.items}
				render={(album) => {
					return <AlbumTile album={album} subtitle="artistName" />;
				}}
			/>

			<Row
				style={styles.section}
				header={t("home.newlyAddedReleases")}
				items={newlyAddedReleases.items}
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
