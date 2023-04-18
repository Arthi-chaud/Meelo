import Artist from "../../models/artist";
import Release from "../../models/release";
import ContextualMenu from "./contextual-menu";
import { useConfirm } from "material-ui-confirm";
import { DownloadAction } from "../actions/download";
import {
	GoToArtistAction, GoToRelatedTracksAction,
	GoToSongLyricsAction, GoToSongVersionAction
} from "../actions/link";
import { PlayAfterAction, PlayNextAction } from "../actions/playlist";
import { ShareSongAction } from "../actions/share";
import { ShowTrackFileInfoAction } from "../actions/show-track-info";
import { TrackWithRelations } from "../../models/track";
import { UpdateTrackIllustrationAction } from "../actions/update-illustration";
import { useQueryClient } from "../../api/use-query";

type ReleaseTrackContextualMenuProps = {
	track: TrackWithRelations<'song'>;
	artist: Artist;
	release: Release;
	onSelect?: () => void;
}

const ReleaseTrackContextualMenu = (props: ReleaseTrackContextualMenuProps) => {
	const songSlug = `${props.artist.slug}+${props.track.song.slug}`;
	const confirm = useConfirm();
	const queryClient = useQueryClient();

	return <ContextualMenu onSelect={props.onSelect} actions={[
		[GoToArtistAction(props.artist.slug)],
		[GoToSongLyricsAction(songSlug)],
		[PlayNextAction(async () => props), PlayAfterAction(async () => props)],
		[GoToSongVersionAction(songSlug), GoToRelatedTracksAction(songSlug),],
		[UpdateTrackIllustrationAction(queryClient, props.track.id)],
		[ShowTrackFileInfoAction(confirm, props.track.id)],
		[DownloadAction(confirm, props.track.stream), ShareSongAction(songSlug)]
	]}/>;
};

export default ReleaseTrackContextualMenu;
