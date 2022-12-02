import Artist from "../../models/artist";
import Release from "../../models/release";
import { TrackWithSong } from "../../models/track";
import ContextualMenu from "./contextual-menu";
import {
	DownloadAction, GoToArtistAction,
	GoToRelatedTracksAction, GoToSongLyricsAction,
	GoToSongVersionAction, PlayAfterAction, PlayNextAction, ShareSongAction, ShowTrackFileInfoAction
} from "./actions";
import { useConfirm } from "material-ui-confirm";

type ReleaseTrackContextualMenuProps = {
	track: TrackWithSong;
	artist: Artist;
	release: Release;
	onSelect?: () => void;
}

const ReleaseTrackContextualMenu = (props: ReleaseTrackContextualMenuProps) => {
	const songSlug = `${props.artist.slug}+${props.track.song.slug}`;
	const confirm = useConfirm();

	return <ContextualMenu onSelect={props.onSelect} actions={[
		[GoToArtistAction(props.artist.slug)],
		[GoToSongLyricsAction(songSlug)],
		[PlayNextAction(async () => props), PlayAfterAction(async () => props)],
		[GoToSongVersionAction(songSlug), GoToRelatedTracksAction(songSlug),],
		[ShowTrackFileInfoAction(confirm, props.track.id)],
		[DownloadAction(confirm, props.track.stream), ShareSongAction(songSlug)]
	]}/>;
};

export default ReleaseTrackContextualMenu;
