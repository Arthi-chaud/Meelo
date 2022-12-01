import {
	Table, TableBody, TableCell, TableRow, Typography
} from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import API from "../api/api";
import { useQuery } from "../api/use-query";
import formatDuration from "../utils/formatDuration";
import { WideLoadingComponent } from "./loading/loading";

const trackQuery = (trackId: number) => ({
	key: ['track', trackId],
	exec: () => API.getTrack(trackId)
});

const sourceFileQuery = (sourceFileId: number) => ({
	key: ['file', sourceFileId],
	exec: () => API.getSourceFile(sourceFileId)
});

/**
 * Table component, listing info of track and its source file
 * @param trackId the id of the track to fetch
 */
const TrackFileInfo = ({ trackId }: { trackId: number }) => {
	const track = useQuery(trackQuery, trackId);
	const sourceFile = useQuery(sourceFileQuery, track.data?.sourceFileId);

	if (!track.data || !sourceFile.data) {
		return <WideLoadingComponent/>;
	}
	const tableContent = {
		'Name': track.data.name,
		'Duration': formatDuration(track.data.duration),
		'Master Track': track.data.master ? 'True' : 'False',
		'Bit Rate': `${track.data.bitrate} kbps`,
		'Type': track.data.type,
		'Path': sourceFile.data.path,
		'Registration Date': new Date(sourceFile.data.registerDate).toLocaleString()
	};

	return <Table>
		<TableBody>
			{ Object.entries(tableContent).map(([key, value], index) =>
				<TableRow key={index}>
					<TableCell>
						<Typography fontWeight='bold'>
							{key}
						</Typography>
					</TableCell>
					<TableCell>
						{value}
					</TableCell>
				</TableRow>
			)}
		</TableBody>
	</Table>;
};

const openTrackFileInfoModal = (
	confirm: ReturnType<typeof useConfirm>, trackId: number
) => confirm({
	title: "Track Information",
	description: <TrackFileInfo trackId={trackId}/>,
	cancellationButtonProps: { sx: { display: 'none' } },
	confirmationButtonProps: { color: 'secondary' }
});

export default TrackFileInfo;

export { openTrackFileInfoModal };
