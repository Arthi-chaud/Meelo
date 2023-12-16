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

import { Box, Typography } from "@mui/material";
import Translate from "../i18n/translate";

type LyricsProps = {
	lyrics?: string[] | null;
	songName: string;
};
const LyricsBox = (props: LyricsProps) => {
	if (!props.lyrics) {
		return (
			<Typography sx={{ fontStyle: "italic" }}>
				<Translate translationKey="noLyricsFound" />
			</Typography>
		);
	}
	return (
		<Box flexDirection="column">
			{props.lyrics.map((lyric, index) => {
				if (lyric.length == 0) {
					return <br key={index} />;
				}
				const hasTitle = lyric
					.toLowerCase()
					.includes(props.songName.toLowerCase());
				const isSection =
					lyric.trim().startsWith("[") && lyric.trim().endsWith("]");

				return (
					<Typography
						key={index}
						variant={isSection ? "caption" : "body1"}
						style={{ fontWeight: hasTitle ? "bold" : undefined }}
					>
						{lyric}
					</Typography>
				);
			})}
		</Box>
	);
};

export default LyricsBox;
