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

import { Box, Button, Divider, Grid, IconButton, Stack } from "@mui/material";
import API from "api/api";
import {
	type Query,
	prepareMeeloQuery,
	useQueries,
	useQuery,
	useQueryClient,
} from "api/use-query";
import { DeletePlaylistAction } from "components/actions/playlist";
import PlaylistContextualMenu from "components/contextual-menu/resource/playlist";
import SongContextualMenu from "components/contextual-menu/resource/song";
import { EmptyState } from "components/empty-state";
import { Head } from "components/head";
import {
	ContextualMenuIcon,
	DoneIcon,
	DragHandleIcon,
	EditIcon,
	EmptyStateIcon,
	PlayIcon,
	PlaylistIcon,
	ShuffleIcon,
	SongIcon,
} from "components/icons";
import Illustration from "components/illustration";
import ListItem from "components/list-item";
import RelationPageHeader from "components/relation-page-header";
import { shuffle } from "d3-array";
import { useSetAtom } from "jotai";
import { useConfirm } from "material-ui-confirm";
import type {
	PlaylistEntry,
	PlaylistEntryWithRelations,
} from "models/playlist";
import type Release from "models/release";
import type { SongWithRelations } from "models/song";
import type { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { type QueryClient, useMutation } from "react-query";
import type { GetPropsTypesFrom, Page } from "ssr";
import { playTracksAtom } from "state/player";
import { generateArray } from "utils/gen-list";
import getSlugOrId from "utils/getSlugOrId";
import { useGradientBackground } from "utils/gradient-background";

const playlistQuery = (idOrSlug: number | string) =>
	API.getPlaylist(idOrSlug, ["illustration"]);
const playlistEntriesQuery = (idOrSlug: number | string) => {
	const query = API.getPlaylistEntires(idOrSlug, [
		"artist",
		"featuring",
		"master",
		"illustration",
	]);
	return {
		key: query.key,
		exec: () => query.exec({ pageSize: 10000 }).then(({ items }) => items),
	};
};

const prepareSSR = async (
	context: NextPageContext,
	queryClient: QueryClient,
) => {
	const playlistIdentifier = getSlugOrId(context.query);
	const entries = await queryClient.fetchQuery(
		prepareMeeloQuery(() => playlistEntriesQuery(playlistIdentifier)),
	);

	return {
		additionalProps: { playlistIdentifier },
		queries: [
			playlistQuery(playlistIdentifier),
			...entries
				.map((entry) =>
					entry.master.releaseId
						? API.getRelease(entry.master.releaseId)
						: undefined,
				)
				.filter(
					(promise): promise is Query<Release> =>
						promise !== undefined,
				),
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
	entry: PlaylistEntryWithRelations<"artist" | "illustration"> | undefined;
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
	const playTracks = useSetAtom(playTracksAtom);
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
	const entriesQuery = useQuery(playlistEntriesQuery, playlistIdentifier);
	const masterTracksReleaseQueries = useQueries(
		...(entriesQuery.data
			?.filter(({ master }) => master.releaseId)
			.map(
				({
					master,
				}): Parameters<
					typeof useQuery<Release, Parameters<typeof API.getRelease>>
				> => [API.getRelease, master.releaseId ?? undefined],
			) ?? []),
	);
	const reorderMutation = useMutation((reorderedEntries: number[]) => {
		return API.reorderPlaylist(playlistIdentifier, reorderedEntries)
			.then(() => {
				toast.success(t("playlistReorderSuccess"));
				return entriesQuery.refetch();
			})
			.catch(() => toast.error(t("playlistReorderFail")));
	});

	const entries = useMemo(() => {
		const releases = masterTracksReleaseQueries.map((query) => query.data);
		const resolvedReleases = releases.filter((data) => data !== undefined);

		if (
			resolvedReleases.length !==
			entriesQuery.data?.filter(({ master }) => master.releaseId != null)
				.length
		) {
			return undefined;
		}

		return entriesQuery.data.map((entry) => ({
			...entry,
			release: releases.find(
				(release) => release!.id === entry.master.releaseId,
			)!,
		}));
	}, [entriesQuery.data, masterTracksReleaseQueries]);
	const playPlaylist = (fromIndex: number) =>
		entries &&
		playTracks({
			tracks: entries.map((entry) => ({
				track: { ...entry.master, illustration: entry.illustration },
				artist: entry.artist,
				release: entry.release,
			})),
			cursor: fromIndex,
		});
	const shufflePlaylist = () =>
		entries &&
		playTracks({
			tracks: shuffle(
				entries.map((entry) => ({
					track: {
						...entry.master,
						illustration: entry.illustration,
					},
					artist: entry.artist,
					release: entry.release,
				})),
			),
			cursor: 0,
		});
	const { GradientBackground } = useGradientBackground(
		playlist.data?.illustration?.colors,
	);

	return (
		<>
			<Head title={playlist.data?.name} />
			<GradientBackground />
			<RelationPageHeader
				illustration={
					<Illustration
						illustration={playlist.data?.illustration}
						quality="original"
						fallback={<PlaylistIcon />}
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
							() => shufflePlaylist(),
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
			) : entries?.length === 0 ? (
				<EmptyState
					actions={[]}
					text="emptyStatePlaylist"
					icon={<EmptyStateIcon />}
				/>
			) : (
				<Stack spacing={1}>
					{(entries ?? generateArray(2)).map((entry, index) => (
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

									if (changes.length !== 0) {
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
