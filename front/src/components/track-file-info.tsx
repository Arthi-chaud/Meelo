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
	Table,
	TableBody,
	TableCell,
	TableRow,
	Typography,
} from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import API from "../api/api";
import { useQuery } from "../api/use-query";
import formatDuration from "../utils/formatDuration";
import { TranslationKey } from "../i18n/i18n";
import { useTranslation } from "react-i18next";

/**
 * Table component, listing info of track and its source file
 * @param trackId the id of the track to fetch
 */
const TrackFileInfo = ({ trackId }: { trackId: number }) => {
	const { t } = useTranslation();
	const track = useQuery((id) => API.getTrack(id, ["song"]), trackId);
	const sourceFile = useQuery(API.getSourceFile, track.data?.sourceFileId);

	const tableContent: Partial<
		Record<TranslationKey, string | number | undefined>
	> = {
		name: track.data?.name,
		remastered: track.data
			? t(track.data.isRemastered ? "yes" : "no")
			: undefined,
		duration: track.data ? formatDuration(track.data.duration) : undefined,
		bitRate: track.data ? `${track.data.bitrate} kbps` : undefined,
		type: track.data?.type,
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
