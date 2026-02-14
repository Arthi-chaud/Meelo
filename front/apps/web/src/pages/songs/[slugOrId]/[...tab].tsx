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
import type { QueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import type { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import type { GetPropsTypesFrom, Page } from "ssr";
import {
	getGenres,
	getSong,
	getSongExternalMetadata,
	getSongs,
	getTracks,
	getVideos,
} from "@/api/queries";
import { toTanStackQuery } from "@/api/query";
import { songTypeToTranslationKey } from "@/models/utils";
import { playTrackAtom } from "@/state/player";
import { PlayIcon } from "@/ui/icons";
import { useAccentColor } from "@/utils/accent-color";
import { generateArray } from "@/utils/gen-list";
import { getAPI, useInfiniteQuery, useQuery } from "~/api";
import ExternalMetadataBadge from "~/components/external-metadata-badge";
import GenreButton from "~/components/genre-button";
import { useGradientBackground } from "~/components/gradient-background";
import { Head } from "~/components/head";
import { InfiniteSongView } from "~/components/infinite/resource/song";
import InfiniteTrackView from "~/components/infinite/resource/track";
import InfiniteVideoView from "~/components/infinite/resource/video";
import LyricsBox from "~/components/lyrics";
import SongRelationPageHeader from "~/components/relation-page-header/resource/song";
import SongTypeIcon from "~/components/song-type-icon";
import { useTabRouter } from "~/components/tab-router";
import getSlugOrId from "~/utils/getSlugOrId";
import { useThemedSxValue } from "~/utils/themed-sx-value";

const prepareSSR = async (
	context: NextPageContext,
	queryClient: QueryClient,
) => {
	const songIdentifier = getSlugOrId(context.query);
	const api = getAPI();
	const song = await queryClient.fetchQuery(
		toTanStackQuery(api, () =>
			getSong(songIdentifier, [
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
		queries: [getSongExternalMetadata(songIdentifier)],
		infiniteQueries: [
			getGenres({ song: songIdentifier }),
			getSongs(
				{ versionsOf: songIdentifier },
				{ sortBy: "name", order: "asc" },
				["artist", "featuring", "master", "illustration"],
			),
			getVideos(
				{ group: song.groupId },
				{ sortBy: "name", order: "asc" },
				["artist", "master", "illustration"],
			),
			getTracks(
				{ song: songIdentifier },
				{ sortBy: "name", order: "asc" },
				["release", "song", "illustration", "video"],
			),
		],
	};
};

const tabs = ["lyrics", "versions", "videos", "tracks", "info"] as const;

const getTabLabel = (tab: (typeof tabs)[number]): TranslationKey => {
	switch (tab) {
		case "lyrics":
			return "models.lyrics";
		case "versions":
			return "models.versions";
		case "videos":
			return "models.video_plural";
		case "tracks":
			return "models.track_plural";
		case "info":
			return "song.infoTab";
	}
};

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
		getSong(songIdentifier, [
			"artist",
			"featuring",
			"lyrics",
			"master",
			"illustration",
		]),
	);
	const externalMetadata = useQuery(getSongExternalMetadata, songIdentifier);
	const genres = useInfiniteQuery(getGenres, { song: songIdentifier });
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
							featuring: song.data.featuring,
						}))
				}
			>
				{t("actions.playback.play")}
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
						label={t(getTabLabel(value))}
					/>
				))}
			</Tabs>
			<Box sx={{ paddingY: 2 }}>
				{selectedTab === "info" && (
					<>
						<Head
							title={
								song.data &&
								`${song.data?.name} (${t("song.infoTab")})`
							}
						/>
						<Stack
							direction="row"
							sx={{
								overflowX: "scroll",
								alignItems: "center",
								paddingBottom: 2,
							}}
							spacing={1}
						>
							<Typography sx={{ overflow: "unset" }}>
								{`${t("song.songType")}: `}
							</Typography>
							{song.data ? (
								song.data.type ? (
									<Stack
										direction="row"
										spacing={1}
										alignItems="center"
									>
										<SongTypeIcon
											type={song.data.type}
											size={20}
										/>
										<Typography>
											{t(
												songTypeToTranslationKey(
													song.data.type,
													false,
												),
											)}
										</Typography>
									</Stack>
								) : null
							) : (
								<Skeleton width="100px" />
							)}
						</Stack>
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
									{`${t("models.genre_plural")}: `}
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
									{`${t("models.externalLink_plural")}: `}
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
								`${song.data?.name} (${t("models.lyrics")})`
							}
						/>
						<LyricsBox
							songName={song.data?.name}
							lyrics={
								song.data
									? (song.data.lyrics?.plain.split("\n") ??
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
								`${song.data.name} (${t("models.versions")})`
							}
						/>
						<InfiniteSongView
							disableShuffle
							query={({ libraries, sortBy, order, types }) =>
								getSongs(
									{
										library: libraries,
										type: types,
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
								`${song.data.name} (${t("models.video_plural")})`
							}
						/>
						<InfiniteVideoView
							query={({ libraries, sortBy, order, types }) =>
								getVideos(
									{
										library: libraries,
										type: types,
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
								`${song.data.name} (${t("models.track_plural")})`
							}
						/>
						<InfiniteTrackView
							query={({ sortBy, order, libraries }) =>
								getTracks(
									{
										song: songIdentifier,
										library: libraries,
									},
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
