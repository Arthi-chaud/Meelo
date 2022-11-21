import {
	Box, Divider, List, ListItem, ListItemButton, ListItemIcon,
	ListItemText, ListSubheader, Typography
} from "@mui/material";
import { useDispatch } from "react-redux";
import Release from "../models/release";
import { SongWithArtist } from "../models/song";
import Track from "../models/track";
import Tracklist from "../models/tracklist";
import { playTracks } from '../state/playerSlice';
import Artist from "../models/artist";
import { MusicVideo } from "@mui/icons-material";
import formatDuration from "../utils/formatDuration";
import ReleaseTrackContextualMenu from "./contextual-menu/release-track-contextual-menu";

type ReleaseTracklistProps = {
	mainArtist?: Artist;
	tracklist: Tracklist<Track & { song: SongWithArtist }>;
	release: Release;
}

/**
 * Interactive tracklist for a release
 */
const ReleaseTrackList = (
	{ tracklist, release, mainArtist }: ReleaseTracklistProps
) => {
	const dispatch = useDispatch();
	const flatTracklist = Array.from(Object.values(tracklist)).flat();

	return <Box>
		{Array.from(Object.entries(tracklist)).map((disc, __, discs) =>
			<List key={disc[0]} subheader={discs.length !== 1 &&
				<ListSubheader>Disc {disc[0]}</ListSubheader>
			}>
				{ disc[1].map((currentTrack) => <>
					<ListItem key={currentTrack.id}
						disablePadding disableGutters
						secondaryAction={
							<ReleaseTrackContextualMenu
								track={currentTrack}
								artist={currentTrack.song.artist}
								release={release}
							/>
						}
					>
						<ListItemButton onClick={() => dispatch(
							playTracks({
								tracks: flatTracklist.map((flatTrack) => ({
									track: flatTrack, release, artist: flatTrack.song.artist
								})),
								cursor: flatTracklist.findIndex(
									(flatTrack) => flatTrack.id == currentTrack.id
								)
							})
						)}>
							<ListItemIcon>
								<Typography>
									{currentTrack.trackIndex}
								</Typography>
							</ListItemIcon>
							<ListItemText
								primary={currentTrack.name}
								secondary={
									currentTrack.song.artistId == mainArtist?.id
										? undefined
										: currentTrack.song.artist?.name
								}
							/>
							{currentTrack.type == 'Video' &&
								<ListItemIcon>
									<MusicVideo color='disabled' fontSize="small" />
								</ListItemIcon>
							}
							<Typography sx={{ paddingLeft: 2, overflow: 'unset' }}>
								{formatDuration(currentTrack.duration)}
							</Typography>
						</ListItemButton>
					</ListItem>
					<Divider variant="inset" />
				</>)}
			</List>)}
	</Box>;
};

export default ReleaseTrackList;