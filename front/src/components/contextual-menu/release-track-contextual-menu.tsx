import { useRouter } from "next/router";
import Artist from "../../models/artist";
import Release from "../../models/release";
import { TrackWithSong } from "../../models/track";
import ContextualMenu from "./contextual-menu";
import {
	DownloadAction, GoToArtistAction,
	GoToRelatedTracksAction, GoToSongLyricsAction,
	GoToSongVersionAction, PlayAfterAction, PlayNextAction, ShareSongAction
} from "./actions";

type ReleaseTrackContextualMenuProps = {
	track: TrackWithSong;
	artist: Artist;
	release: Release;
	onSelect?: () => void;
}

const ReleaseTrackContextualMenu = (props: ReleaseTrackContextualMenuProps) => {
	const songSlug = `${props.artist.slug}+${props.track.song.slug}`;
	const router = useRouter();

	return <ContextualMenu onSelect={props.onSelect} actions={[
		[GoToArtistAction(props.artist.slug),],
		[GoToSongLyricsAction(songSlug)],
		[PlayNextAction(async () => props), PlayAfterAction(async () => props)],
		[GoToSongVersionAction(songSlug), GoToRelatedTracksAction(songSlug),],
		[DownloadAction(router, props.track.stream), ShareSongAction(songSlug)]
	]}/>;
};

export default ReleaseTrackContextualMenu;
