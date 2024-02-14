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
import RelationPageHeader from "../../../components/relation-page-header/relation-page-header";
import { GetPropsTypesFrom, Page } from "../../../ssr";
import getSlugOrId from "../../../utils/getSlugOrId";
import {
	prepareMeeloQuery,
	useQueries,
	useQuery,
	useQueryClient,
} from "../../../api/use-query";
import PlaylistContextualMenu from "../../../components/contextual-menu/playlist-contextual-menu";
import Illustration from "../../../components/illustration";
import { Box, Button, Divider, Grid, IconButton, Stack } from "@mui/material";
import Artist from "../../../models/artist";
import { TrackWithRelations } from "../../../models/track";
import { SongWithRelations } from "../../../models/song";
import {
	ContextualMenuIcon,
	DoneIcon,
	DragHandleIcon,
	EditIcon,
	PlayIcon,
	ShuffleIcon,
	SongIcon,
} from "../../../components/icons";
import ListItem from "../../../components/list-item/item";
import SongContextualMenu from "../../../components/contextual-menu/song-contextual-menu";
import { PlaylistEntry } from "../../../models/playlist";
import { useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import toast from "react-hot-toast";
import { QueryClient, useMutation } from "react-query";
import { shuffle } from "d3-array";
import { DeletePlaylistAction } from "../../../components/actions/playlist";
import { useConfirm } from "material-ui-confirm";
import GradientBackground from "../../../components/gradient-background";
import { useTranslation } from "react-i18next";
import { generateArray } from "../../../utils/gen-list";
import { usePlayerContext } from "../../../contexts/player";
import { NextPageContext } from "next";

const playlistQuery = (idOrSlug: number | string) =>
	API.getPlaylist(idOrSlug, ["entries"]);
const masterTrackQuery = (songId: number | string) =>
	API.getMasterTrack(songId, ["release"]);

const prepareSSR = async (
	context: NextPageContext,
	queryClient: QueryClient,
) => {
	const playlistIdentifier = getSlugOrId(context.query);
	const playlist = await queryClient.fetchQuery(
		prepareMeeloQuery(() => playlistQuery(playlistIdentifier)),
	);

	return {
		additionalProps: { playlistIdentifier },
		queries: [
			...playlist.entries.map((entry) => masterTrackQuery(entry.id)),
			...playlist.entries.map((entry) => API.getArtist(entry.artistId)),
		],
	};
};

type DragAndDropPlaylistProps = {
	entries: (PlaylistEntry & SongWithRelations<"artist">)[];
	onDropped: (
		entries: (PlaylistEntry & SongWithRelations<"artist">)[],
	) => void;
};

const DragAndDropPlaylist = (props: DragAndDropPlaylistProps) => {
	return (
		<DragDropContext
			onDragEnd={(result) => {
				if (result.destination) {
					const redordered = props.entries;
					const [removed] = redordered.splice(result.source.index, 1);

					redordered.splice(result.destination.index, 0, removed);
					props.onDropped(redordered);
				}
			}}
		>
			<Droppable droppableId="droppable-playlist-entries">
				{(provided) => (
					<div {...provided.droppableProps} ref={provided.innerRef}>
						<Stack spacing={1}>
							{props.entries.map((playlistItem, index) => (
								<Draggable
									draggableId={index.toString()}
									key={index}
									index={index}
								>
									{(providedChild) => (
										<div
											ref={providedChild.innerRef}
											{...providedChild.draggableProps}
											style={{
												...providedChild.draggableProps
													.style,
											}}
										>
											<ListItem
												title={playlistItem.name}
												secondTitle={
													playlistItem.artist.name
												}
												icon={
													<Box
														{...providedChild.dragHandleProps}
														sx={{
															aspectRatio: "1",
															display: "flex",
															justifyContent:
																"center",
															alignItems:
																"center",
														}}
													>
														<DragHandleIcon />
													</Box>
												}
												onClick={() => {}}
												trailing={
													<IconButton disabled>
														<ContextualMenuIcon />
													</IconButton>
												}
											/>
										</div>
									)}
								</Draggable>
							))}
							{provided.placeholder}
						</Stack>
					</div>
				)}
			</Droppable>
		</DragDropContext>
	);
};

type PlaylistEntryItemProps = {
	onClick: () => void;
	entry: (PlaylistEntry & SongWithRelations<"artist">) | undefined;
};

const PlaylistEntryItem = ({ entry, onClick }: PlaylistEntryItemProps) => (
	<ListItem
		icon={
			<Illustration
				quality="low"
				illustration={entry?.illustration}
				fallback={<SongIcon />}
			/>
		}
		title={entry?.name}
		onClick={onClick}
		trailing={
			entry && <SongContextualMenu song={entry} entryId={entry.entryId} />
		}
		secondTitle={entry?.artist.name}
	/>
);

const PlaylistPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({
	props,
}) => {
	const { t } = useTranslation();
	const router = useRouter();
	const { playTracks } = usePlayerContext();
	const confirm = useConfirm();
	const queryClient = useQueryClient();
	const [editState, setEditState] = useState(false);
	const [tempPlaylistEdit, setTempEdit] = useState<
		(PlaylistEntry & SongWithRelations<"artist">)[]
	>([]);
	const playlistIdentifier =
		props?.playlistIdentifier ?? getSlugOrId(router.query);
	const deleteAction = DeletePlaylistAction(
		confirm,
		queryClient,
		playlistIdentifier,
		() => router.push("/playlists"),
	);
	const playlist = useQuery(playlistQuery, playlistIdentifier);
	const artistsQueries = useQueries(
		...(playlist.data?.entries.map(
			({
				artistId,
			}): Parameters<
				typeof useQuery<Artist, Parameters<typeof API.getArtist>>
			> => [API.getArtist, artistId],
		) ?? []),
	);
	const masterTracksQueries = useQueries(
		...(playlist.data?.entries.map(
			({
				id,
			}): Parameters<
				typeof useQuery<
					TrackWithRelations<"release">,
					Parameters<typeof masterTrackQuery>
				>
			> => [masterTrackQuery, id],
		) ?? []),
	);
	const reorderMutation = useMutation((reorderedEntries: number[]) => {
		return API.reorderPlaylist(playlistIdentifier, reorderedEntries)
			.then(() => {
				toast.success(t("playlistReorderSuccess"));
				return playlist.refetch();
			})
			.catch(() => toast.error(t("playlistReorderFail")));
	});

	const entries = useMemo(() => {
		const artists = artistsQueries.map((query) => query.data);
		const masterTracks = masterTracksQueries.map((query) => query.data);
		const resolvedTracks = masterTracks.filter(
			(data) => data !== undefined,
		);
		const resolvedArtists = artists.filter((data) => data !== undefined);

		if (
			resolvedTracks.length !== masterTracks.length ||
			resolvedArtists.length !== artists.length
		) {
			return undefined;
		}

		return playlist.data?.entries.map((entry) => ({
			...entry,
			track: masterTracks.find((master) => master!.songId == entry.id)!,
			artist: artists.find((artist) => artist!.id == entry.artistId)!,
		}));
	}, [artistsQueries, masterTracksQueries, playlist.data]);
	const playPlaylist = (fromIndex: number) =>
		entries &&
		playTracks({
			tracks: entries.map((entry) => ({
				track: entry.track,
				artist: entry.artist,
				release: entry.track.release,
			})),
			cursor: fromIndex,
		});
	const shufflePlaylist = () =>
		entries &&
		playTracks({
			tracks: shuffle(
				entries.map((entry) => ({
					track: entry.track,
					artist: entry.artist,
					release: entry.track.release,
				})),
			),
			cursor: 0,
		});

	return (
		<>
			<GradientBackground colors={playlist.data?.illustration?.colors} />
			<RelationPageHeader
				illustration={
					<Illustration
						illustration={playlist.data?.illustration}
						quality="original"
					/>
				}
				title={playlist.data?.name}
				secondTitle={null}
				trailing={
					playlist.data ? (
						<PlaylistContextualMenu playlist={playlist.data} />
					) : undefined
				}
			/>

			<Grid container direction={{ xs: "column", sm: "row" }} spacing={1}>
				{(
					[
						[
							"play",
							() => <PlayIcon />,
							"contained",
							() => playPlaylist(0),
						],
						[
							"shuffle",
							() => <ShuffleIcon />,
							"outlined",
							() => shufflePlaylist,
						],
					] as const
				).map(([label, Icon, variant, callback], index) => (
					<Grid item xs key={index}>
						<Button
							variant={variant}
							color="primary"
							startIcon={<Icon />}
							sx={{ width: "100%" }}
							onClick={callback}
							disabled={entries === undefined}
						>
							{t(label)}
						</Button>
					</Grid>
				))}
			</Grid>
			<Divider sx={{ marginY: 2 }} />
			{editState ? (
				<DragAndDropPlaylist
					entries={tempPlaylistEdit}
					onDropped={setTempEdit}
				/>
			) : (
				<Stack spacing={1}>
					{(entries ?? generateArray(6)).map((entry, index) => (
						<PlaylistEntryItem
							key={index}
							entry={entry}
							onClick={() => playPlaylist(index)}
						/>
					))}
				</Stack>
			)}
			<Divider sx={{ marginY: 2 }} />
			<Grid
				container
				direction={{ xs: "column", sm: "row" }}
				spacing={1}
				sx={{ justifyContent: { xs: "space-evenly", sm: "end" } }}
			>
				<Grid item>
					<Button
						variant={editState ? "contained" : "outlined"}
						color="primary"
						startIcon={editState ? <DoneIcon /> : <EditIcon />}
						sx={{ width: "100%" }}
						disabled={entries === undefined}
						onClick={
							entries &&
							(() => {
								if (editState) {
									const editComparison = entries.map(
										(entry, index) => ({
											oldEntryId: entry.entryId,
											newEntryId:
												tempPlaylistEdit.at(index)!
													.entryId,
											index,
										}),
									);
									const changes = editComparison.filter(
										({ oldEntryId, newEntryId }) =>
											newEntryId !== oldEntryId,
									);

									if (changes.length != 0) {
										reorderMutation
											.mutateAsync(
												tempPlaylistEdit.map(
													({ entryId }) => entryId,
												),
											)
											.finally(() => setEditState(false));
									} else {
										setEditState(false);
									}
								} else {
									setEditState(true);
									// To set the state before passing it to the dragndrop list
									setTempEdit(entries);
								}
							})
						}
					>
						{t(editState ? "done" : "edit")}
					</Button>
				</Grid>
				<Grid item>
					<Button
						variant="outlined"
						color="error"
						disabled={entries === undefined}
						startIcon={deleteAction.icon}
						sx={{ width: "100%" }}
						onClick={deleteAction.onClick}
					>
						{t(deleteAction.label)}
					</Button>
				</Grid>
			</Grid>
		</>
	);
};

PlaylistPage.prepareSSR = prepareSSR;

export default PlaylistPage;
