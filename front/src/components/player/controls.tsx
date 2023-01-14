import {
	FastForward, FastRewind, MoreVert, Pause
	, PlayArrow
} from "@mui/icons-material";
import {
	Box, Button, ButtonBase, Container, Divider, Grid,
	IconButton, Tab, Tabs, Typography
} from "@mui/material";
import Illustration from "../illustration";
import { WideLoadingComponent } from "../loading/loading";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import CloseIcon from '@mui/icons-material/Close';
import { LegacyRef, useState } from "react";
import PlayerSlider from "./controls/slider";
import API from '../../api/api';
import { useQuery } from "../../api/use-query";
import LyricsBox from "../lyrics";
import Track from "../../models/track";
import Artist from "../../models/artist";
import Link from "next/link";
import { SongWithArtist, SongWithLyrics } from "../../models/song";
import ReleaseTrackContextualMenu from "../contextual-menu/release-track-contextual-menu";
import Release from "../../models/release";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../state/store";
import ListItem from '../list-item/item';
import { skipTrack } from '../../state/playerSlice';

const songQuery = (slugOrId: string | number) => ({
	key: ['song', slugOrId],
	exec: () => API.getSong<SongWithLyrics & SongWithArtist>(slugOrId, ['lyrics', 'artist'])
});

type PlayerButtonControlsProps = {
	playing: boolean;
	onPause: () => void;
	onPlay: () => void;
	onSkipTrack: () => void;
	onRewind: () => void;
}

type PlayerControlsProps =
	Parameters<typeof PlayerSlider>[number] &
	PlayerButtonControlsProps & {
	expanded: boolean,
	illustration?: string | null,
	onExpand: (expand: boolean) => void,
	artist?: Artist,
	track?: Track,
	release?: Release
}

const playerTextStyle = {
	whiteSpace: 'nowrap'
};

type ControlButtonProps = {
	icon: JSX.Element;
	onClick: () => void;
}

const ControlButton = (props: ControlButtonProps) =>
	<IconButton onClick={props.onClick} color='inherit'>
		{props.icon}
	</IconButton>;

const PlayButton = (props: { isPlaying: boolean, onPause: () => void, onPlay: () => void }) =>
	<ControlButton
		icon={props.isPlaying ? <Pause/> : <PlayArrow/>}
		onClick={props.isPlaying ? props.onPause : props.onPlay}
	/>
;

const SkipButton = (props: Omit<ControlButtonProps, 'icon'>) =>
	<ControlButton {...props} icon={<FastForward/>} />
;

const PreviousButton = (props: Omit<ControlButtonProps, 'icon'>) =>
	<ControlButton {...props} icon={<FastRewind/>} />
;

const MinimizedPlayerControls = (props: PlayerControlsProps) => {
	return <ButtonBase
		onClick={() => props.onExpand(true)} disableTouchRipple
		sx={{ width: '100%', height: '100%', padding: 0, margin: 0 }}
	>
		<Grid container spacing={1} sx={{
			alignItems: 'center', display: 'flex',
			justifyContent: 'center', paddingX: 1
		}}>
			<Grid item xs={1.5} sm={1}
				md={0.8} lg={0.6} xl={0.5}>
				{ props.track ? <Illustration
					url={props.track?.illustration ?? null}
					fallback={<AudiotrackIcon />}
				/> : <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
					<AudiotrackIcon />
				</Box> }
			</Grid>
			<Grid item container xs
				spacing={0.5} sx={{
					overflow: 'hidden', display: 'flex',
					alignItems: 'space-evenly', marginLeft: { xs: 0, sm: 1 }
				}}
			>
				<Grid item sx={{
					width: '100%', display: 'flex', ...playerTextStyle,
					justifyContent: { xs: 'left', md: 'center' }
				}}>
					<Typography sx={{ fontWeight: 'bold', ...playerTextStyle }}>
						{props.track?.name}
					</Typography>
				</Grid>
				<Grid item sx={{
					display: 'flex', width: '100%', ...playerTextStyle,
					justifyContent: { xs: 'left', md: 'center' }
				}}>
					<Typography sx={{
						fontWeight: 'light', ...playerTextStyle,
						fontSize: { xs: 'medium' }
					}}>
						{props.artist?.name}
					</Typography>
				</Grid>
				<Grid
					item
					onClick={(event) => event.stopPropagation()}
					sx={{
						display: { xs: 'none', lg: 'flex' }, width: '90%',
						justifyContent: 'center'
					}}
				>
					<PlayerSlider
						onSlide={props.onSlide}
						duration={props.duration}
						progress={props.progress}
					/>
				</Grid>
			</Grid>
			<Grid item container xs={3}
				flexWrap='nowrap'
				sm={2} onClick={(event) => event.stopPropagation()}
			>
				<Grid item xs sx={{ display: { xs: 'none', lg: 'block' } }}>
					<PreviousButton onClick={props.onRewind}/>
				</Grid>
				<Grid item xs>
					<PlayButton
						onPause={props.onPause}
						onPlay={props.onPlay}
						isPlaying={props.playing}
					/>
				</Grid>
				<Grid item xs>
					<SkipButton onClick={props.onSkipTrack}/>
				</Grid>
			</Grid>
		</Grid>
	</ButtonBase>;
};

const ExpandedPlayerControls = (
	props: PlayerControlsProps & { videoRef: LegacyRef<HTMLVideoElement> }
) => {
	const dispatch = useDispatch();
	const parentSong = useQuery(songQuery, props.track?.songId);
	const [panel, setPanel] = useState<'lyrics' | 'playlist'>('lyrics');
	const playlist = useSelector((state: RootState) => state.player.playlist);
	const cursor = useSelector((state: RootState) => state.player.cursor);

	return <Box sx={{ width: '100%', height: '100%' }}>
		<Box sx={{
			width: '100%', display: 'flex',
			justifyContent: 'flex-end', padding: 2
		}}>
			<IconButton onClick={() => props.onExpand(false)}>
				<CloseIcon />
			</IconButton>
		</Box>
		<Grid container direction='column' sx={{
			flexWrap: 'nowrap', height: props.track?.type != 'Video' ? '75vh' : '80vh',
			width: 'inherit', justifyContent: 'space-evenly', alignItems: 'center'
		}}>
			{props.track?.type == 'Video' ?
				<Grid item xs={5} sm={8}
					sx={{ overflow: 'hidden' }}>
					<video
						playsInline ref={props.videoRef}
						disablePictureInPicture={false}
						width='100%' height='100%'
					/>
				</Grid> : <Grid
					item
					xs={6} sm sx={{
						aspectRatio: '1', display: 'flex',
						justifyContent: 'center', alignItems: 'center'
					}}>
					{props.illustration
						? <Illustration url={props.illustration} fallback={<AudiotrackIcon />} />
						: <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
							<AudiotrackIcon />
						</Box>
					}
				</Grid>
			}
			<Grid item xs={4} container
				spacing={2} direction="column" sx={{
					width: '100%', height: '100%', justifyContent: 'center',
					alignItems: 'center', display: 'flex', paddingY: 4
				}}
			>
				<Grid item container direction='column'
					sx={{
						width: '100%', ...playerTextStyle, display: 'flex',
						alignItems: 'center', justifyContent: 'center'
					}}
				>
					{ !props.artist || !props.track
						? <Box/>
						: <Grid item container sx={{
							...playerTextStyle, width: '100%',
							display: 'flex', justifyContent: 'center'
						}}>
							<Grid item xs={1}></Grid>
							<Grid item xs={10} sx={{
								...playerTextStyle, display: 'flex', justifyContent: 'center'
							}}>
								<Link href={`/releases/${props.track.releaseId}`} style={{
									overflow: 'hidden', textOverflow: 'ellipsis'
								}}>
									<Button
										onClick={() => props.onExpand(false)}
										sx={{ textTransform: 'none', color: 'inherit', width: '100%' }}
									>
										<Typography sx={{ fontWeight: 'bold', ...playerTextStyle }}>
											{ props.track?.name }
										</Typography>
									</Button>
								</Link>
							</Grid>
							<Grid item xs={1}>
								{props.track && parentSong.data && props.artist && props.release ?
									<ReleaseTrackContextualMenu
										artist={props.artist} release={props.release}
										track={{ ...props.track, song: parentSong.data }}
										onSelect={() => props.onExpand(false)}
									/> :
									<IconButton><MoreVert/></IconButton>
								}
							</Grid>
						</Grid>
					}
					{ !props.track || !props.artist ?
						<Box/> :
						<Grid item sx={{
							width: '100%', ...playerTextStyle,
							display: 'flex', justifyContent: 'center'
						}}>
							<Link href={`/artists/${props.artist.slug}`}
								style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
							>
								<Button onClick={() => props.onExpand(false)} sx={{
									textTransform: 'none', color: 'inherit', width: '100%'
								}}>
									<Typography sx={{ ...playerTextStyle }}>
										{ props.artist?.name }
									</Typography>
								</Button>
							</Link>
						</Grid>
					}
				</Grid>
				<Grid item container spacing={5}
					sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
					<Grid item>
						<PreviousButton onClick={props.onRewind}/>
					</Grid>
					<Grid item>
						<PlayButton
							onPause={props.onPause}
							onPlay={props.onPlay}
							isPlaying={props.playing}
						/>
					</Grid>
					<Grid item>
						<SkipButton onClick={props.onSkipTrack}/>
					</Grid>
				</Grid>
				<Grid item sx={{ width: '90%' }}>
					<PlayerSlider
						onSlide={props.onSlide}
						duration={props.duration}
						progress={props.progress}
					/>
				</Grid>
			</Grid>
		</Grid>
		<Divider variant="middle"/>
		<Container maxWidth={false}>
			<Tabs
				value={panel}
				onChange={(__, panelName) => setPanel(panelName)}
				variant="fullWidth"
			>
				<Tab key={0} value={'lyrics'} label={'Lyrics'}/>
				<Tab key={1} value={'playlist'} label={'Playlist'}/>
			</Tabs>
			<Container maxWidth={false} sx={{ paddingY: 2 }}>
				{ panel == 'lyrics' && props.track && (!parentSong.data ?
					<WideLoadingComponent/> :
					<LyricsBox
						lyrics={parentSong.data.lyrics?.content.split('\n')}
						songName={props.track.name}
					/>)
				}
				{ panel == 'playlist' && playlist.slice(cursor + 1).map(
					(playlistItem, index) => <>
						<ListItem
							key={`playlist-track-${index}-${playlistItem.track.id}`}
							icon={<Illustration url={playlistItem.track.illustration}/>}
							title={playlistItem.track.name}
							secondTitle={playlistItem.artist.name}
							trailing={<></>}
							onClick={() => {
								let toSkip = index + 1;

								while (toSkip > 0) {
									dispatch(skipTrack());
									toSkip--;
								}
							}}
						/>
						<Divider variant='middle'/>
					</>
				)}
			</Container>
		</Container>
	</Box>;
};

export { MinimizedPlayerControls, ExpandedPlayerControls };
