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
	Chip,
	Grid,
	IconButton,
	Skeleton,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import Link from "next/link";
import { useMemo } from "react";
import type { AlbumWithRelations } from "@/models/album";
import type { AlbumExternalMetadata } from "@/models/external-metadata";
import type Genre from "@/models/genre";
import { PlayIcon } from "@/ui/icons";
import { useAccentColor } from "@/utils/accent-color";
import { generateArray } from "@/utils/gen-list";
import { useQueryClient } from "~/api";
import Illustration from "~/components/illustration";
import { PlayReleaseAction } from "./actions/play-album";

type HighlightCardProps = {
	album: AlbumWithRelations<"artist" | "illustration"> | undefined;
	genres: Genre[] | undefined;
	externalMetadata: AlbumExternalMetadata | null | undefined;
};

const AlbumHighlightCard = ({
	album,
	genres,
	externalMetadata,
}: HighlightCardProps) => {
	const theme = useTheme();
	const queryClient = useQueryClient();
	const accentColor = useAccentColor(album?.illustration);
	const cardColor = useMemo(() => {
		if (accentColor !== null) {
			const themePaperColor = `rgba(${theme.vars.palette.background.defaultChannel} / 0.75)`;
			return {
				[theme.getColorSchemeSelector("light")]: {
					backgroundColor: `color-mix(in srgb, ${accentColor.light} 40%, ${themePaperColor})`,
				},
				[theme.getColorSchemeSelector("dark")]: {
					backgroundColor: `color-mix(in srgb, ${accentColor.dark} 40%, ${themePaperColor})`,
				},
			};
		}
		return {
			backgroundColor: `rgba(${theme.vars.palette.background.defaultChannel} / 0.40)`,
		};
	}, [accentColor, theme]);
	const style = {
		...cardColor,
		boxShadow: "none",
		transform: "scale(1)",
		transition: "transform 0.2s",
		":hover": {
			transform: "scale(1.02)",
		},
	} as const;
	// TODO Use sth else
	const description = useMemo(() => {
		if (externalMetadata === undefined) {
			return undefined;
		}
		return externalMetadata?.description ?? null;
	}, [externalMetadata]);

	const playAlbum = () => {
		if (album?.masterId) {
			PlayReleaseAction(album?.masterId, queryClient).onClick();
		}
	};
	return (
		<Link
			href={album ? `/albums/${album.slug}` : {}}
			passHref
			legacyBehavior
		>
			<Grid
				container
				sx={{
					aspectRatio: "2.5",
					width: "100%",
					height: "100%",
					flexWrap: "nowrap",
					...style,
					overflow: "hidden",
					cursor: "pointer",
				}}
				style={{ borderRadius: theme.shape.borderRadius }}
			>
				<Grid sx={{ aspectRatio: "1", height: "100%" }}>
					<Illustration
						illustration={album?.illustration}
						imgProps={{ borderRadius: 0 }}
						quality="medium"
					/>
				</Grid>
				<Grid container size="grow" sx={{ height: "100%" }}>
					<Stack
						sx={{
							width: "100%",
							height: "100%",
							padding: 2,
						}}
					>
						<Grid
							container
							spacing={1}
							sx={{
								width: "100%",
								alignItems: "center",
								display: "flex",
							}}
						>
							<Grid
								size={"grow"}
								sx={{
									flexDirection: "column",
									justifyContent: "center",
									alignItems: "flex-start",
								}}
							>
								<Typography
									variant="h6"
									noWrap
									sx={{
										width: "100%",
										overflow: "hidden",
										textOverflow: "ellipsis",
									}}
								>
									{album?.name ?? <Skeleton variant="text" />}
								</Typography>

								{album?.artist !== null && (
									<Link
										href={
											album
												? `/artists/${album.artist.slug}`
												: {}
										}
									>
										<Typography
											variant="body1"
											noWrap
											sx={{
												color: "text.secondary",
												width: "100%",
												overflow: "hidden",
												textOverflow: "ellipsis",
												":hover": {
													textDecoration: "underline",
												},
											}}
										>
											{album ? (
												album.artist?.name
											) : (
												<Skeleton variant="text" />
											)}
										</Typography>
									</Link>
								)}
							</Grid>
							<Grid
								size={"auto"}
								sx={{
									display: "flex",
									justifyItems: "center",
									alignItems: "center",
								}}
							>
								<IconButton
									onClick={(e) => {
										e.stopPropagation();
										playAlbum();
									}}
								>
									<PlayIcon />
								</IconButton>
							</Grid>
						</Grid>
						<Box
							sx={{
								overflowY: "scroll",
								overflowX: "clip",
								flexGrow: 1,
								marginRight: -2,
								paddingY: 1,
								paddingRight: 2,
							}}
						>
							{description !== null && (
								<Typography
									variant="body2"
									sx={{
										lineHeight: 1.5,
										color: "text.disabled",
										width: "100%",
									}}
								>
									{description ?? <Skeleton variant="text" />}
								</Typography>
							)}
						</Box>
						{genres?.length !== 0 && (
							<Grid
								container
								spacing={1}
								sx={{ marginTop: 1, height: 24 }}
							>
								{(genres ?? generateArray(1, undefined)).map(
									(genre, index) => (
										<Grid key={index}>
											<Link
												href={
													genre
														? `/genres/${genre.slug}`
														: {}
												}
												key={index}
											>
												<Chip
													variant="filled"
													clickable
													label={genre?.name}
												/>
											</Link>
										</Grid>
									),
								)}
							</Grid>
						)}
					</Stack>
				</Grid>
			</Grid>
		</Link>
	);
};

export default AlbumHighlightCard;
