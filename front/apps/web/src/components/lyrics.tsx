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

import { Box, Skeleton, Typography } from "@mui/material";
import { LyricsIcon } from "@/ui/icons";
import { generateArray } from "@/utils/gen-list";
import { EmptyState } from "~/components/empty-state";
import Fade from "~/components/fade";

type LyricsProps = {
	lyrics: string[] | null | undefined;
	songName: string | undefined;
};
const LyricsBox = (props: LyricsProps) => {
	if (props.lyrics === null) {
		return (
			<EmptyState
				actions={[]}
				text={"emptyState.lyrics"}
				icon={<LyricsIcon />}
			/>
		);
	}
	return (
		<Fade in>
			<Box flexDirection="column">
				{props.lyrics !== undefined
					? props.lyrics.map((lyric, index) => {
							if (lyric.length === 0) {
								return <br key={index} />;
							}
							const hasTitle =
								props.songName === undefined
									? false
									: lyric
											.toLowerCase()
											.includes(
												props.songName.toLowerCase(),
											);
							const isSection =
								lyric.trim().startsWith("[") &&
								lyric.trim().endsWith("]");

							return (
								<Typography
									key={index}
									variant={isSection ? "caption" : "body1"}
									style={{
										fontWeight: hasTitle
											? "bold"
											: undefined,
									}}
								>
									{lyric}
								</Typography>
							);
						})
					: generateArray(20).map((_, index) =>
							index % 5 === 0 ? (
								<br key={index} />
							) : (
								<Skeleton
									key={index}
									width={`${4 + (index % 5)}0%`}
								/>
							),
						)}
			</Box>
		</Fade>
	);
};

export default LyricsBox;
