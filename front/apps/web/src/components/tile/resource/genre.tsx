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
	Grid,
	IconButton,
	Paper,
	Skeleton,
	Typography,
	useTheme,
} from "@mui/material";
import { useSetAtom } from "jotai";
import Link from "next/link";
import { useMemo } from "react";
import { getSongs } from "@/api/queries";
import { transformPage } from "@/api/query";
import type Genre from "@/models/genre";
import { playFromInfiniteQuery } from "@/state/player";
import { RadioIcon } from "@/ui/icons";
import { getRandomNumber } from "@/utils/random";
import { useQueryClient } from "~/api";

// Stolen from https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
const stringToColour = (str: string) => {
	let hash = 0;
	str.split("").forEach((char) => {
		hash = char.charCodeAt(0) + ((hash << 5) - hash);
	});
	let colour = "#";
	for (let i = 0; i < 3; i++) {
		const value = (hash >> (i * 8)) & 0xff;
		colour += value.toString(16).padStart(2, "0");
	}
	return colour;
};

type Props = {
	genre: Genre | undefined;
};

export const GenreTile = ({ genre }: Props) => {
	const queryClient = useQueryClient();
	const theme = useTheme();
	const play = useSetAtom(playFromInfiniteQuery);

	const buttonColor = useMemo(() => {
		if (genre === undefined) {
			return {};
		}
		const genreColor = stringToColour(genre.slug);
		const themePaperColor = `rgba(${theme.vars.palette.background.defaultChannel}/ 0.75)`;
		const topColor = `color-mix(in srgb, ${genreColor} 55%, ${themePaperColor})`;
		const bottomColor = `color-mix(in srgb, ${genreColor} 40%, ${themePaperColor})`;

		return {
			background: `linear-gradient(0deg, ${topColor} 0%, ${bottomColor} 100%)`,
		};
	}, [theme, genre]);
	return (
		<Link href={genre ? `/genres/${genre.slug}` : {}} passHref>
			<Paper
				sx={{
					...buttonColor,
					":hover": { transform: "scale(1.04)" },
					transition: "transform 0.2s",
					position: "relative",
				}}
			>
				<Grid
					container
					columnSpacing={2}
					sx={{
						paddingX: 2,
						paddingY: 4,
					}}
				>
					<Grid size={{ xs: 4 }}>
						{genre && (
							<IconButton
								onClick={(e) => {
									e.preventDefault();
									play(
										transformPage(
											getSongs(
												{
													genre: genre.slug,
													random: getRandomNumber(),
												},
												undefined,
												[
													"master",
													"illustration",
													"featuring",
													"artist",
												],
											),
											(song) => ({
												track: {
													...song.master,
													illustration:
														song.illustration,
												},
												artist: song.artist,
												featuring: song.featuring,
												id: song.id,
											}),
										),
										queryClient,
									);
								}}
							>
								<RadioIcon />
							</IconButton>
						)}
					</Grid>
					<Grid
						size={{ xs: 8 }}
						sx={{
							display: "flex",
							alignItems: "center",
							overflow: "hidden",
							whiteSpace: "nowrap",
							textOverflow: "ellipsis",
						}}
					>
						<Typography variant="body1" fontWeight={450}>
							{genre?.name ?? <Skeleton width={"60px"} />}
						</Typography>
					</Grid>
				</Grid>
			</Paper>
		</Link>
	);
};
