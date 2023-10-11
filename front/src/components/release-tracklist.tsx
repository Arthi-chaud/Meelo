import {
	Box, Divider, Icon, List, ListItem, ListItemButton, ListItemIcon,
	ListItemText, ListSubheader, Typography
} from "@mui/material";
import { useDispatch } from "react-redux";
import Release from "../models/release";
import Track from "../models/track";
import Tracklist from "../models/tracklist";
import { playTracks } from '../state/playerSlice';
import Artist from "../models/artist";
import formatDuration from "../utils/formatDuration";
import ReleaseTrackContextualMenu from "./contextual-menu/release-track-contextual-menu";
import { SongWithRelations } from "../models/song";
import Translate from "../i18n/translate";
import { VideoIcon } from "./icons";

type ReleaseTracklistProps = {
	mainArtist?: Artist;
	tracklist: Tracklist<Track & { song: SongWithRelations<'artist'> }>;
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
				<ListSubheader><Translate translationKey='disc'/> {disc[0]}</ListSubheader>
			}>
				{ disc[1].map((currentTrack) => <>
					<ListItem key={currentTrack.id}
						dense={currentTrack.song.artistId != mainArtist?.id}
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
						)} sx={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
							<ListItemIcon>
								<Typography color='text.disabled'>
									{currentTrack.trackIndex}
								</Typography>
							</ListItemIcon>
							<ListItemText
								primary={currentTrack.name}
								primaryTypographyProps={{
									fontSize: 'medium',
								}}
								secondary={
									currentTrack.song.artistId == mainArtist?.id
										? undefined
										: currentTrack.song.artist?.name
								}
								secondaryTypographyProps={{
									fontSize: 'small',
									color: 'text.disabled'
								}}
							/>
							{currentTrack.type == 'Video' &&
								<Icon sx={{ marginLeft: 2, display: 'flex', alignItems: 'center' }}>
									<VideoIcon color='disabled' fontSize="small" />
								</Icon>
							}
							<Typography color='text.disabled' sx={{ marginLeft: 2, overflow: 'unset' }}>
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
