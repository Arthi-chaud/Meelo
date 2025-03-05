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

import {
	Box,
	Button,
	Divider,
	Skeleton,
	Stack,
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import { useSetAtom } from "jotai";
import type { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import type { QueryClient } from "react-query";
import API from "../../../api/api";
import {
	prepareMeeloQuery,
	useInfiniteQuery,
	useQuery,
} from "../../../api/use-query";
import ExternalMetadataBadge from "../../../components/external-metadata-badge";
import GenreButton from "../../../components/genre-button";
import { Head } from "../../../components/head";
import { PlayIcon } from "../../../components/icons";
import InfiniteSongView from "../../../components/infinite/infinite-resource-view/infinite-song-view";
import InfiniteTrackView from "../../../components/infinite/infinite-resource-view/infinite-track-view";
import InfiniteVideoView from "../../../components/infinite/infinite-resource-view/infinite-video-view";
import LyricsBox from "../../../components/lyrics";
import SongRelationPageHeader from "../../../components/relation-page-header/song-relation-page-header";
import { useTabRouter } from "../../../components/tab-router";
import type { GetPropsTypesFrom, Page } from "../../../ssr";
import { playTrackAtom } from "../../../state/player";
import { useAccentColor } from "../../../utils/accent-color";
import { generateArray } from "../../../utils/gen-list";
import getSlugOrId from "../../../utils/getSlugOrId";
import { useGradientBackground } from "../../../utils/gradient-background";
import { useThemedSxValue } from "../../../utils/themed-sx-value";

const externalMetadataQuery = (songIdentifier: string | number) =>
	API.getSongExternalMetadata(songIdentifier);

const prepareSSR = async (
	context: NextPageContext,
	queryClient: QueryClient,
) => {
	const songIdentifier = getSlugOrId(context.query);
	const song = await queryClient.fetchQuery(
		prepareMeeloQuery(() =>
			API.getSong(songIdentifier, [
				"artist",
				"featuring",
				"lyrics",
				"master",
				"illustration",
			]),
		),
	);

	return {
		additionalProps: { songIdentifier },
		queries: [externalMetadataQuery(songIdentifier)],
		infiniteQueries: [
			API.getGenres({ song: songIdentifier }),
			API.getSongs(
				{ versionsOf: songIdentifier },
				{ sortBy: "name", order: "asc" },
				["artist", "featuring", "master", "illustration"],
			),

			API.getVideos(
				{ group: song.groupId },
				{ sortBy: "name", order: "asc" },
				["artist", "master", "illustration"],
			),
			API.getTracks(
				{ song: songIdentifier },
				{ sortBy: "name", order: "asc" },
				["release", "song", "illustration", "video"],
			),
		],
	};
};

const tabs = ["lyrics", "versions", "videos", "tracks", "info"] as const;

const SongPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const { selectedTab, selectTab } = useTabRouter(
		(router) => router.query.tab,
		(newTab) => `/songs/${songIdentifier}/${newTab}`,
		...tabs,
	);
	const { t } = useTranslation();
	const router = useRouter();
	const playTrack = useSetAtom(playTrackAtom);
	const songIdentifier = props?.songIdentifier ?? getSlugOrId(router.query);
	const song = useQuery(() =>
		API.getSong(songIdentifier, [
			"artist",
			"featuring",
			"lyrics",
			"master",
			"illustration",
		]),
	);
	const externalMetadata = useQuery(externalMetadataQuery, songIdentifier);
	const genres = useInfiniteQuery(API.getGenres, { song: songIdentifier });
	const { GradientBackground } = useGradientBackground(
		song.data?.illustration?.colors,
	);
	const accentColor = useAccentColor(song.data?.illustration);
	const genreButtonOutline = useThemedSxValue(
		"borderColor",
		accentColor?.light,
		accentColor?.dark,
	);

	return (
		<>
			<Head title={song.data?.name} />
			<GradientBackground />
			<SongRelationPageHeader song={song.data} />
			<Button
				variant="contained"
				sx={{ width: "100%", marginTop: 1 }}
				endIcon={<PlayIcon />}
				onClick={
					song.data &&
					(() =>
						playTrack({
							track: {
								...song.data.master,
								illustration: song.data.illustration,
							},
							artist: song.data.artist,
						}))
				}
			>
				{t("play")}
			</Button>
			<Divider sx={{ paddingY: 1 }} />
			<Tabs
				value={selectedTab}
				onChange={(__, tabName) => selectTab(tabName)}
				variant="scrollable"
			>
				{tabs.map((value, index) => (
					<Tab
						key={index}
						value={value}
						sx={{ minWidth: "fit-content", flex: 1 }}
						label={t(value)}
					/>
				))}
			</Tabs>
			<Box sx={{ paddingY: 2 }}>
				{selectedTab === "info" && (
					<>
						<Head
							title={
								song.data && `${song.data?.name} (${t("info")})`
							}
						/>
						{song.data ? (
							song.data.bpm ? (
								<Typography
									sx={{ paddingTop: 1, paddingBottom: 4 }}
								>{`BPM: ${song.data.bpm}`}</Typography>
							) : null
						) : (
							<Skeleton width={"50px"} />
						)}
						{(genres.items === undefined ||
							genres.items.length !== 0) && (
							<Stack
								direction="row"
								sx={{
									overflowX: "scroll",
									alignItems: "center",
								}}
								spacing={2}
							>
								<Typography sx={{ overflow: "unset" }}>
									{`${t("genres")}: `}
								</Typography>
								{(genres.items ?? generateArray(2)).map(
									(genre, index) => (
										<GenreButton
											sx={genreButtonOutline}
											key={index}
											genre={genre}
										/>
									),
								)}
							</Stack>
						)}
						{(song.data === undefined ||
							externalMetadata.data?.sources.length) && (
							<Stack
								direction="row"
								sx={{
									overflowX: "scroll",
									alignItems: "center",
									paddingTop: 2,
								}}
								spacing={2}
							>
								<Typography sx={{ overflow: "unset" }}>
									{`${t("externalLinks")}: `}
								</Typography>
								{(
									externalMetadata.data?.sources.filter(
										({ url }) => url !== null,
									) ?? generateArray(2)
								).map((source, index) => (
									<ExternalMetadataBadge
										key={index}
										source={source}
									/>
								))}
							</Stack>
						)}
						<Typography variant="body1" sx={{ paddingTop: 2 }}>
							{externalMetadata.data?.description}
						</Typography>
					</>
				)}
				{selectedTab === "lyrics" && (
					<>
						<Head
							title={
								song.data &&
								`${song.data?.name} (${t("lyrics")})`
							}
						/>
						<LyricsBox
							songName={song.data?.name}
							lyrics={
								song.data
									? (song.data.lyrics?.content.split("\n") ??
										null)
									: undefined
							}
						/>
					</>
				)}
				{selectedTab === "versions" && (
					<>
						<Head
							title={
								song.data &&
								`${song.data.name} (${t("versions")})`
							}
						/>
						<InfiniteSongView
							disableShuffle
							query={({ library, sortBy, order, type }) =>
								API.getSongs(
									{
										library: library ?? undefined,
										type,
										versionsOf: songIdentifier,
									},
									{ sortBy, order },
									[
										"artist",
										"featuring",
										"master",
										"illustration",
									],
								)
							}
						/>
					</>
				)}

				{selectedTab === "videos" && (
					<>
						<Head
							title={
								song.data &&
								`${song.data.name} (${t("videos")})`
							}
						/>
						<InfiniteVideoView
							query={({ library, sortBy, order, type }) =>
								API.getVideos(
									{
										library: library ?? undefined,
										type,
										group: song.data?.groupId,
									},
									{ sortBy, order },
									["artist", "master", "illustration"],
								)
							}
							subtitle="duration"
						/>
					</>
				)}
				{selectedTab === "tracks" && (
					<>
						<Head
							title={
								song.data &&
								`${song.data.name} (${t("tracks")})`
							}
						/>
						<InfiniteTrackView
							query={({ sortBy, order }) =>
								API.getTracks(
									{ song: songIdentifier },
									{ sortBy, order },
									[
										"release",
										"song",
										"illustration",
										"video",
									],
								)
							}
						/>
					</>
				)}
			</Box>
		</>
	);
};

SongPage.prepareSSR = prepareSSR;

export default SongPage;
