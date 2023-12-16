import {
	Box,
	Divider,
	Icon,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	ListSubheader,
	Typography,
	useTheme,
} from "@mui/material";
import { useDispatch } from "react-redux";
import Release from "../models/release";
import Track from "../models/track";
import Tracklist from "../models/tracklist";
import { playTracks } from "../state/playerSlice";
import Artist from "../models/artist";
import formatDuration from "../utils/formatDuration";
import ReleaseTrackContextualMenu from "./contextual-menu/release-track-contextual-menu";
import { SongWithRelations } from "../models/song";
import Translate from "../i18n/translate";
import { VideoIcon } from "./icons";
import formatArtists from "../utils/formatArtists";

type ReleaseTracklistProps = {
	mainArtist?: Artist;
	tracklist: Tracklist<
		Track & { song: SongWithRelations<"artist" | "featuring"> }
	>;
	release: Release;
};

/**
 * Interactive tracklist for a release
 */
const ReleaseTrackList = ({
	tracklist,
	release,
	mainArtist,
}: ReleaseTracklistProps) => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const flatTracklist = Array.from(Object.values(tracklist)).flat();
	const formatTracksubtitle = (
		song: SongWithRelations<"artist" | "featuring">,
	) => {
		if (song.artistId === mainArtist?.id && song.featuring?.length === 0) {
			return undefined;
		}
		return formatArtists(song.artist, song.featuring);
	};

	return (
		<Box>
			{Array.from(Object.entries(tracklist)).map((disc, __, discs) => (
				<List
					key={disc[0]}
					subheader={
						discs.length !== 1 && (
							<ListSubheader disableSticky>
								<Translate translationKey="disc" /> {disc[0]}
							</ListSubheader>
						)
					}
				>
					{disc[1].map((currentTrack) => (
						<>
							<ListItem
								key={currentTrack.id}
								dense={
									currentTrack.song.artistId != mainArtist?.id
								}
								disablePadding
								disableGutters
								secondaryAction={
									<ReleaseTrackContextualMenu
										track={currentTrack}
										artist={currentTrack.song.artist}
										release={release}
									/>
								}
							>
								<ListItemButton
									onClick={() =>
										dispatch(
											playTracks({
												tracks: flatTracklist.map(
													(flatTrack) => ({
														track: flatTrack,
														release,
														artist: flatTrack.song
															.artist,
													}),
												),
												cursor: flatTracklist.findIndex(
													(flatTrack) =>
														flatTrack.id ==
														currentTrack.id,
												),
											}),
										)
									}
									sx={{
										borderTopRightRadius: 0,
										borderBottomRightRadius: 0,
									}}
								>
									<ListItemIcon>
										<Typography color="text.disabled">
											{currentTrack.trackIndex}
										</Typography>
									</ListItemIcon>
									<ListItemText
										primary={currentTrack.name}
										primaryTypographyProps={{
											fontSize: "medium",
										}}
										secondary={formatTracksubtitle(
											currentTrack.song,
										)}
										secondaryTypographyProps={{
											fontSize: "small",
											color: "text.disabled",
										}}
									/>
									{currentTrack.isBonus && (
										<Typography
											color={theme.palette.text.disabled}
										>
											<Translate translationKey="bonusTrack" />
										</Typography>
									)}
									{currentTrack.type == "Video" && (
										<Icon
											sx={{
												marginLeft: 2,
												display: "flex",
												alignItems: "center",
											}}
										>
											<VideoIcon
												color={
													theme.palette.text.disabled
												}
											/>
										</Icon>
									)}
									<Typography
										color="text.disabled"
										sx={{
											marginLeft: 2,
											overflow: "unset",
										}}
									>
										{formatDuration(currentTrack.duration)}
									</Typography>
								</ListItemButton>
							</ListItem>
							<Divider variant="inset" />
						</>
					))}
				</List>
			))}
		</Box>
	);
};

export default ReleaseTrackList;
