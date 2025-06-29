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

import { getAlbums, getArtists } from "@/api/queries";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { InfiniteRow } from "~/components/infinite/row";
import { AlbumTile } from "~/components/tile/resource/album";
import { ArtistTile } from "~/components/tile/resource/artist";
import { useRootViewStyle } from "~/hooks/root-view-style";

const styles = StyleSheet.create((theme) => ({
	main: {},
	section: {
		paddingBottom: theme.gap(2),
	},
}));

//TODO Page header?

export default function Root() {
	const newlyAddedAlbums = getAlbums(
		{},
		{ sortBy: "addDate", order: "desc" },
		["illustration", "artist"],
	);

	const newlyAddedArtists = getArtists(
		{},
		{ sortBy: "addDate", order: "desc" },
		["illustration"],
	);

	const latestAlbums = getAlbums(
		{},
		{ sortBy: "releaseDate", order: "desc" },
		["illustration", "artist"],
	);
	const { t } = useTranslation();
	const pageStyle = useRootViewStyle();

	return (
		<View style={[styles.main, pageStyle]}>
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

			{/* TODO Newly added releases*/}

			{/* TODO Genres*/}

			{/* TODO Most played songs*/}
		</View>
	);
}
