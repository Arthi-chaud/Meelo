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

import { Box, Stack, Typography } from "@mui/material";
import { type MutableRefObject, useEffect, useRef, useState } from "react";
import type { Lyrics, SyncedLyric } from "../../../models/lyrics";
import LyricsBox from "../../lyrics";

export const LyricsComponent = ({
	lyrics,
	songName,
	progress,
	setProgress,
	playerIsExpanded,
}: {
	lyrics: Lyrics | null | undefined;
	songName?: string;
	progress?: MutableRefObject<number | null>;
	setProgress: (newProgress: number) => void;
	playerIsExpanded: boolean;
}) => {
	if (lyrics?.synced && progress) {
		return (
			<SyncedLyricsComponent
				syncedLyrics={lyrics.synced}
				progress={progress}
				setProgress={setProgress}
				playerIsExpanded={playerIsExpanded}
			/>
		);
	}
	return (
		<Box
			sx={{
				overflowY: "scroll",
				marginLeft: 2,
				paddingRight: 3,
				alignSelf: "center",
			}}
		>
			{
				<LyricsBox
					lyrics={lyrics?.plain.split("\n") ?? null}
					songName={songName}
				/>
			}
		</Box>
	);
};

type SyncedLyricWithNext = SyncedLyric & { next: number | null };

const SyncedLyricsComponent = ({
	syncedLyrics,
	progress,
	setProgress,
	playerIsExpanded,
}: {
	syncedLyrics: NonNullable<Lyrics["synced"]>;
	progress: MutableRefObject<number | null>;
	setProgress: (newProgress: number) => void;
	playerIsExpanded: boolean;
}) => {
	const [syncedLyricsWithNext, setLyricsWithNext] =
		useState<SyncedLyricWithNext[]>();
	const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1);
	const intervalRef = useRef<NodeJS.Timer>();

	// Do this async-ly, to avoid lag
	useEffect(() => {
		const sortedLyrics = syncedLyrics.toSorted(
			(la, lb) => la.timestamp - lb.timestamp,
		);
		setLyricsWithNext(
			sortedLyrics.map((entry, index) => {
				return {
					...entry,
					next: sortedLyrics.at(index + 1)?.timestamp ?? null,
				};
			}),
		);
	}, []);
	useEffect(() => {
		if (!playerIsExpanded) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = undefined;
			}
			return;
		}
		if (intervalRef.current) {
			return;
		}
		intervalRef.current = setInterval(() => {
			const progressValue = progress.current;
			if (progressValue === null || syncedLyricsWithNext === undefined) {
				return;
			}
			const currentLyric = syncedLyricsWithNext.at(currentLyricIndex);
			if (
				currentLyric &&
				currentLyric.timestamp <= progressValue &&
				(currentLyric.next ? progressValue < currentLyric.next : true)
			) {
				return;
			}

			const nextLyricIndex = syncedLyricsWithNext?.findIndex(
				(entry) =>
					entry.timestamp <= progressValue &&
					(entry.next ? progressValue < entry.next : true),
			);
			if (nextLyricIndex === undefined) {
				return;
			}

			document.getElementById(`lyric-${nextLyricIndex}`)?.scrollIntoView({
				behavior: "smooth",
				block: "center",
				inline: "center",
			});
			setCurrentLyricIndex(nextLyricIndex);
		}, 100);
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = undefined;
			}
		};
	}, [playerIsExpanded, syncedLyricsWithNext]);
	return (
		<Box sx={{ height: "100%", width: "100%", overflow: "hidden" }}>
			<Stack spacing={4}>
				{syncedLyricsWithNext?.map((entry, i) => (
					<Typography
						id={`lyric-${i}`}
						key={`lyric-${i}`}
						variant={i === currentLyricIndex ? "h4" : "h6"}
						component={"div"}
						sx={{
							cursor: "pointer",
							transition:
								"font-size .2s ease-in; font-weight .2s ease-in",
							filter:
								i === currentLyricIndex
									? undefined
									: "blur(1px)",
							fontWeight:
								i === currentLyricIndex ? "bold" : undefined,
						}}
						onClick={() => setProgress(entry.timestamp)}
					>
						{entry.content || <br />}
					</Typography>
				))}
			</Stack>
		</Box>
	);
};
