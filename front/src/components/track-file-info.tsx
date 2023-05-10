import {
	Table, TableBody, TableCell, TableRow, Typography
} from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import API from "../api/api";
import { useQuery } from "../api/use-query";
import formatDuration from "../utils/formatDuration";
import { WideLoadingComponent } from "./loading/loading";
import Translate, { translate } from "../i18n/translate";
import { TranslationKey } from "../i18n/translations/type";

/**
 * Table component, listing info of track and its source file
 * @param trackId the id of the track to fetch
 */
const TrackFileInfo = ({ trackId }: { trackId: number }) => {
	const track = useQuery((id) => API.getTrack(id, ['song']), trackId);
	const sourceFile = useQuery(API.getSourceFile, track.data?.sourceFileId);

	if (!track.data || !sourceFile.data) {
		return <WideLoadingComponent/>;
	}
	const tableContent: Partial<Record<TranslationKey, string | number>> = {
		name: track.data.name,
		playCount: track.data.song.playCount,
		duration: formatDuration(track.data.duration),
		bitRate: `${track.data.bitrate} kbps`,
		type: track.data.type,
		extension: sourceFile.data.path.split('.').reverse()[0].toLocaleUpperCase() ?? 'Unknown',
		path: sourceFile.data.path,
		registrationDate: new Date(sourceFile.data.registerDate).toLocaleString()
	};

	return <Table>
		<TableBody>
			{ Object.entries(tableContent).map(([key, value], index) =>
				<TableRow key={index}>
					<TableCell>
						<Typography fontWeight='bold'>
							<Translate translationKey={key as TranslationKey}/>
						</Typography>
					</TableCell>
					<TableCell>
						{value}
					</TableCell>
				</TableRow>)}
		</TableBody>
	</Table>;
};

const openTrackFileInfoModal = (
	confirm: ReturnType<typeof useConfirm>, trackId: number
) => confirm({
	title: translate('trackInformation'),
	description: <TrackFileInfo trackId={trackId}/>,
	cancellationButtonProps: { sx: { display: 'none' } }
});

export default TrackFileInfo;

export { openTrackFileInfoModal };
