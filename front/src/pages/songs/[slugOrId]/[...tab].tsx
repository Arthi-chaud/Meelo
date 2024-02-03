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

import { useRouter } from "next/router";
import API from "../../../api/api";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import getSlugOrId from "../../../utils/getSlugOrId";
import {
	useInfiniteQuery,
	useQuery,
	useQueryClient,
} from "../../../api/use-query";
import {
	Box,
	Button,
	Divider,
	Stack,
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import LyricsBox from "../../../components/lyrics";
import SongRelationPageHeader from "../../../components/relation-page-header/song-relation-page-header";
import { useState } from "react";
import InfiniteSongView from "../../../components/infinite/infinite-resource-view/infinite-song-view";
import InfiniteTrackView from "../../../components/infinite/infinite-resource-view/infinite-track-view";
import { useDispatch } from "react-redux";
import { playTrack } from "../../../state/playerSlice";
import ExternalIdBadge from "../../../components/external-id-badge";
import { PlayIcon } from "../../../components/icons";
import GenreButton from "../../../components/genre-button";
import GradientBackground from "../../../components/gradient-background";
import { useTranslation } from "react-i18next";

export const getServerSideProps = prepareSSR((context) => {
	const songIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { songIdentifier },
		queries: [
			API.getSong(songIdentifier, [
				"artist",
				"externalIds",
				"featuring",
				"lyrics",
			]),
		],
		infiniteQueries: [
			API.getGenres({ song: songIdentifier }),
			API.getSongs(
				{ versionsOf: songIdentifier },
				{ sortBy: "name", order: "asc" },
				["artist", "featuring"],
			),
			API.getTracks(
				{ song: songIdentifier },
				{ sortBy: "name", order: "asc" },
				["release", "song"],
			),
		],
	};
});

const tabs = ["lyrics", "versions", "tracks", "more"] as const;

const SongPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	/**
	 * Parses the query to find the requested tab, fallback on tabs[0]
	 */
	const getTabFromQuery = () =>
		tabs.find(
			(availableTab) =>
				availableTab == router.query.tab?.toString().toLowerCase(),
		) ?? tabs[0];
	const { t } = useTranslation();
	const router = useRouter();
	const [tab, setTabs] = useState<(typeof tabs)[number]>(getTabFromQuery());
	const queryClient = useQueryClient();
	const songIdentifier =
		props.additionalProps?.songIdentifier ?? getSlugOrId(router.query);
	const song = useQuery(() =>
		API.getSong(songIdentifier, [
			"artist",
			"externalIds",
			"featuring",
			"lyrics",
		]),
	);
	const genres = useInfiniteQuery(API.getGenres, { song: songIdentifier });
	const dispatch = useDispatch();

	return (
		<Box sx={{ width: "100%" }}>
			<GradientBackground colors={song.data?.illustration?.colors} />
			<SongRelationPageHeader song={song.data} />
			<Button
				variant="contained"
				sx={{ width: "100%", marginTop: 1 }}
				endIcon={<PlayIcon />}
				onClick={
					song.data &&
					(() =>
						queryClient
							.fetchQuery(
								API.getMasterTrack(songIdentifier, ["release"]),
							)
							.then((master) =>
								dispatch(
									playTrack({
										track: master,
										artist: song.data.artist,
										release: master.release,
									}),
								),
							))
				}
			>
				{t("play")}
			</Button>
			<Divider sx={{ paddingY: 1 }} />
			<Tabs
				value={tab}
				onChange={(__, tabName) => {
					setTabs(tabName);
					router.push(
						`/songs/${songIdentifier}/${tabName}`,
						undefined,
						{
							shallow: true,
						},
					);
				}}
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
				{tab == "more" && (
					<>
						{(!genres.data ||
							(genres.data.pages.at(0)?.items.length ?? 0) !=
								0) && (
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
								{(
									genres.data?.pages.at(0)?.items ??
									Array(2).fill(undefined)
								).map((genre, index) => (
									<GenreButton key={index} genre={genre} />
								))}
							</Stack>
						)}
						{(!song.data || song.data.externalIds.length != 0) && (
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
									song.data?.externalIds.filter(
										({ url }) => url !== null,
									) ?? Array(2).fill(undefined)
								).map((externalId, index) => (
									<ExternalIdBadge
										key={index}
										externalId={externalId}
									/>
								))}
							</Stack>
						)}
						<Typography variant="body1" sx={{ paddingTop: 2 }}>
							{song.data?.externalIds
								.map(({ description }) => description)
								.filter((desc) => desc !== null)
								.at(0)}
						</Typography>
					</>
				)}
				{tab == "lyrics" && (
					<LyricsBox
						songName={song.data?.name}
						lyrics={
							song.data
								? song.data.lyrics?.content.split("\n") ?? null
								: undefined
						}
					/>
				)}
				{tab == "versions" && (
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
								["artist", "featuring"],
							)
						}
					/>
				)}
				{tab == "tracks" && (
					<InfiniteTrackView
						query={(sort) =>
							API.getTracks({ song: songIdentifier }, sort, [
								"release",
								"song",
							])
						}
					/>
				)}
			</Box>
		</Box>
	);
};

export default SongPage;
