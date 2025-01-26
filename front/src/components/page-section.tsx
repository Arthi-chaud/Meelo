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

import { Box, Button, Grid } from "@mui/material";
import { type ComponentProps, Fragment } from "react";
import { useTranslation } from "react-i18next";
import type { UseInfiniteQueryResult, UseQueryResult } from "react-query";
import type { TranslationKey } from "../i18n/i18n";
import type { AlbumWithRelations } from "../models/album";
import type Artist from "../models/artist";
import type { SongWithRelations } from "../models/song";
import type { VideoWithRelations } from "../models/video";
import { generateArray } from "../utils/gen-list";
import getYear from "../utils/getYear";
import { MoreIcon } from "./icons";
import SectionHeader from "./section-header";
import SongGrid from "./song-grid";
import TileRow from "./tile-row";
import AlbumTile from "./tile/album-tile";
import VideoTile from "./tile/video-tile";
import Fade from "./fade";
import Link from "next/link";

export const SectionPadding = 4;

export type PageSectionProps<T> = {
	title: TranslationKey;
	artist: UseQueryResult<Artist>;
	seeMoreHref?: string;
	maxItemCount: number;
	child: (items: T[] | undefined) => JSX.Element;
	query?: UseInfiniteQueryResult<{ items: T[] }>;
	items?: T[] | undefined;
	minimizePadding?: true;
};

export const SongGridPageSection = (
	props: Omit<
		PageSectionProps<
			SongWithRelations<
				"artist" | "illustration" | "featuring" | "master"
			>
		>,
		"child"
	>,
) => {
	return (
		<PageSection
			{...props}
			child={(items) => (
				<Grid
					item
					container
					sx={{
						display: "block",
						flexGrow: 1,
					}}
				>
					<SongGrid
						parentArtistName={props.artist?.data?.name}
						songs={
							items?.slice(0, props.maxItemCount) ??
							generateArray(props.maxItemCount)
						}
					/>
				</Grid>
			)}
		/>
	);
};

export const ListPageSection = <T,>(
	props: Omit<PageSectionProps<T>, "child"> & {
		builder: (item: T | undefined, index: number) => JSX.Element;
	},
) => {
	return (
		<PageSection
			{...props}
			maxItemCount={props.maxItemCount}
			child={(items) => (
				<Grid item sx={{ overflowX: "scroll", width: "100%" }}>
					<TileRow
						tiles={(
							items?.slice(0, props.maxItemCount) ??
							generateArray(6)
						).map((item, index) => (
							<Fragment key={index}>
								{props.builder(item, index)}
							</Fragment>
						))}
					/>
				</Grid>
			)}
		/>
	);
};

export const AlbumListPageSection = (
	props: Omit<
		PageSectionProps<AlbumWithRelations<"illustration">>,
		"child"
	> & { subtitleIs: "artistName" | "releaseYear" },
) => {
	return (
		<ListPageSection
			{...props}
			minimizePadding
			builder={(item, index) => (
				<AlbumTile
					key={`album-${item?.slug}-${index}`}
					album={
						item && props.artist?.data
							? {
									// Note: we expect this to be overwritten for albums that are not from main artst
									artist: props.artist?.data,
									...item,
								}
							: undefined
					}
					formatSubtitle={
						props.subtitleIs == "artistName"
							? undefined
							: (albumItem) =>
									getYear(
										albumItem.releaseDate,
									)?.toString() ?? ""
					}
				/>
			)}
		/>
	);
};

export const VideoListPageSection = (
	props: Omit<
		PageSectionProps<
			VideoWithRelations<"artist" | "master" | "illustration">
		>,
		"child"
	> &
		Omit<ComponentProps<typeof VideoTile>, "video">,
) => {
	return (
		<ListPageSection
			{...props}
			minimizePadding
			builder={(item, index) => (
				<VideoTile
					key={`video-${item?.slug}-${index}`}
					video={item}
					subtitle={props.subtitle}
				/>
			)}
		/>
	);
};

const PageSection = <T,>(props: PageSectionProps<T>) => {
	const { t } = useTranslation();
	const data = props.query?.data || props.items;
	const firstPage = props.query?.data?.pages.at(0)?.items ?? props.items;
	return (
		<>
			{firstPage?.length != 0 && (
				<>
					<SectionHeader
						heading={
							data !== undefined ? t(props.title) : undefined
						}
						trailing={
							props.seeMoreHref ? (
								<Fade
									in={
										(firstPage?.length ?? 0) >
										props.maxItemCount
									}
								>
									<Link href={props.seeMoreHref}>
										<Button
											variant="contained"
											color="secondary"
											endIcon={<MoreIcon />}
											sx={{
												textTransform: "none",
												fontWeight: "bold",
											}}
										>
											{t("seeAll")}
										</Button>
									</Link>
								</Fade>
							) : undefined
						}
					/>
					{props.child(firstPage)}
					<Box
						sx={{
							paddingBottom: props.minimizePadding
								? 0
								: SectionPadding,
						}}
					/>
				</>
			)}
		</>
	);
};
