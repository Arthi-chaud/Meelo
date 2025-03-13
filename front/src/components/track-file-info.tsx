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
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Typography,
	useTheme,
} from "@mui/material";
import type { useConfirm } from "material-ui-confirm";
import { useTranslation } from "react-i18next";
import API from "../api/api";
import { useQuery } from "../api/use-query";
import type { TranslationKey } from "../i18n/i18n";
import formatDuration from "../utils/formatDuration";
import SongTypeIcon from "./song-type-icon";

/**
 * Table component, listing info of track and its source file
 * @param trackId the id of the track to fetch
 */
const TrackFileInfo = ({ trackId }: { trackId: number }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const track = useQuery((id) => API.getTrack(id, ["song"]), trackId);
	const sourceFile = useQuery(API.getSourceFile, track.data?.sourceFileId);
	const songType = track.data?.song?.type;

	const tableContent: Partial<
		Record<TranslationKey, string | number | undefined | JSX.Element>
	> = {
		name: track.data?.name,
		type: track.data?.type,
		songType: track.data?.song
			? songType && (
					<Stack direction="row" spacing={1} alignItems="center">
						<SongTypeIcon
							type={songType}
							size={theme.typography.body1.fontSize as number}
						/>
						{t(songType)}
					</Stack>
				)
			: track.data?.song === undefined
				? undefined
				: "N/A",
		remastered: track.data
			? t(track.data.isRemastered ? "yes" : "no")
			: undefined,
		bpm: track.data?.song
			? (track.data.song.bpm ?? t("Unknown"))
			: track.data?.song === undefined
				? undefined
				: "N/A",
		duration: track.data ? formatDuration(track.data.duration) : undefined,
		bitRate: track.data
			? track.data.bitrate
				? `${track.data.bitrate} kbps`
				: t("Unknown")
			: undefined,
		extension: sourceFile.data
			? (sourceFile.data.path
					.split(".")
					.reverse()[0]
					.toLocaleUpperCase() ?? "Unknown")
			: undefined,
		path: sourceFile.data?.path,
		registrationDate: sourceFile.data
			? new Date(sourceFile.data.registerDate).toLocaleString()
			: undefined,
	};

	return (
		<Table>
			<TableBody>
				{Object.entries(tableContent).map(([key, value], index) => (
					<TableRow key={index}>
						<TableCell>
							<Typography fontWeight="bold">
								{t(key as TranslationKey)}
							</Typography>
						</TableCell>
						<TableCell>{value ?? <Skeleton />}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

const openTrackFileInfoModal = (
	confirm: ReturnType<typeof useConfirm>,
	trackId: number,
) =>
	confirm({
		title: "",
		description: <TrackFileInfo trackId={trackId} />,
		cancellationButtonProps: { sx: { display: "none" } },
	});

export default TrackFileInfo;

export { openTrackFileInfoModal };
