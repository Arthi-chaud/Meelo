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
import { useState } from "react";
import {
	SongSortingKeys,
	SongType,
	SongWithRelations,
} from "../../../models/song";
import Controls, { OptionState } from "../../controls/controls";
import SongItem from "../../list-item/song-item";
import InfiniteView from "../infinite-view";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import { useLanguage } from "../../../i18n/translate";
import { ShuffleIcon } from "../../icons";
import {
	prepareMeeloInfiniteQuery,
	useQueryClient,
} from "../../../api/use-query";
import { useDispatch } from "react-redux";
import { emptyPlaylist, playNext } from "../../../state/playerSlice";
import API from "../../../api/api";

type AdditionalProps = {
	type?: SongType;
	random?: number;
};

const InfiniteSongView = (
	props: InfiniteResourceViewProps<
		SongWithRelations<"artist" | "featuring">,
		typeof SongSortingKeys,
		AdditionalProps
	> &
		Pick<Parameters<typeof SongItem>[0], "formatSubtitle"> & {
			disableShuffle?: boolean;
		},
) => {
	const router = useRouter();
	const [options, setOptions] =
		useState<OptionState<typeof SongSortingKeys, AdditionalProps>>();
	const language = useLanguage();
	const queryClient = useQueryClient();
	const dispatch = useDispatch();
	const query = {
		type:
			// @ts-ignore
			options?.type == "All" ? undefined : (options?.type as SongType),
		sortBy: options?.sortBy ?? "name",
		order: options?.order ?? "asc",
		view: "grid",
		library: options?.library ?? null,
	} as const;

	return (
		<>
			<Controls
				options={[
					{
						label: (options?.type as SongType) ?? "All",
						name: "type",
						values: [
							"All",
							...SongType.filter((type) => type != "Unknown"),
						],
						currentValue: options?.type,
					},
				]}
				actions={
					props.disableShuffle !== true
						? [
								{
									label: "shuffle",
									icon: <ShuffleIcon />,
									onClick: () => {
										dispatch(emptyPlaylist());
										queryClient.client
											.fetchInfiniteQuery(
												prepareMeeloInfiniteQuery(
													props.query,
													{
														...query,
														random: Math.floor(
															Math.random() *
																1000,
														),
													},
												),
											)
											.then((res) => {
												return res.pages
													.flatMap(
														({ items }) => items,
													)
													.map((song) =>
														queryClient
															.fetchQuery(
																API.getMasterTrack(
																	song.id,
																	["release"],
																),
															)
															.then(
																({
																	release,
																	...track
																}) =>
																	dispatch(
																		playNext(
																			{
																				release,
																				track,
																				artist: song.artist,
																			},
																		),
																	),
															),
													);
											});
									},
								},
							]
						: undefined
				}
				onChange={setOptions}
				sortingKeys={SongSortingKeys}
				defaultSortingOrder={props.initialSortingOrder}
				defaultSortingKey={props.initialSortingField}
				router={props.light == true ? undefined : router}
				disableLayoutToggle
				defaultLayout={"list"}
			/>
			<InfiniteView
				view={options?.view ?? "list"}
				query={() => props.query(query)}
				renderListItem={(
					item: SongWithRelations<"artist" | "featuring">,
				) => (
					<SongItem
						song={item}
						key={item.id}
						formatSubtitle={props.formatSubtitle}
					/>
				)}
				renderGridItem={(
					item: SongWithRelations<"artist" | "featuring">,
				) => <></>}
			/>
		</>
	);
};

export default InfiniteSongView;
