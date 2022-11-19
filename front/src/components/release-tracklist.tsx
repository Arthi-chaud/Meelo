import {
	Box, Divider, List, ListItem, ListItemButton, ListItemIcon,
	ListItemText, ListSubheader, Typography
} from "@mui/material";
import { useDispatch } from "react-redux";
import Release from "../models/release";
import { SongWithArtist } from "../models/song";
import Track from "../models/track";
import Tracklist from "../models/tracklist";
import ContextualMenu from "./contextual-menu/contextual-menu";
import { playTracks } from '../state/playerSlice';
import formatDuration from "format-duration";
import Artist from "../models/artist";
import { MusicVideo } from "@mui/icons-material";

type ReleaseTracklistProps = {
	mainArtist?: Artist;
	tracklist: Tracklist<Track & { song: SongWithArtist }>;
	release: Release;
	trackContextualMenu: (song: Track & { song: SongWithArtist }) =>
		ReturnType<typeof ContextualMenu>;
}

/**
 * Interactive tracklist for a release
 */
const ReleaseTrackList = (
	{ tracklist, release, trackContextualMenu, mainArtist }: ReleaseTracklistProps
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
						secondaryAction={trackContextualMenu(currentTrack)}
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
