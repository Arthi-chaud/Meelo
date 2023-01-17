import {
	FastForward, FastRewind, MoreVert, Pause
	, PlayArrow
} from "@mui/icons-material";
import {
	Box, Button, ButtonBase, Container, Divider, Grid,
	IconButton, Stack, Tab, Tabs, Typography
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
import { reorder, skipTrack } from '../../state/playerSlice';
import {
	DragDropContext,
	Draggable,
	Droppable
} from 'react-beautiful-dnd';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import formatDuration from "../../utils/formatDuration";

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
						color: 'text.disabled', ...playerTextStyle,
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

	return <Stack sx={{ width: '100%', height: '100%', display: 'flex', padding: 2, overflowY: { xs: 'auto', lg: 'clip' }, overflowX: 'clip' }} direction='column'>
		<Box sx={{ alignSelf: 'flex-end', margin: 1 }}>
			<IconButton onClick={() => props.onExpand(false)}>
				<CloseIcon />
			</IconButton>
		</Box>
		<Grid container>
			<Grid item container xs={12} lg={7} sx={{ height: { xs: '80vh', lg: '90vh' }, flexWrap: 'nowrap', justifyContent: { lg: 'center' } }} direction='column'>
				<Grid item xs={7} sx={{ padding: 3, overflow: 'hidden', aspectRatio: '1' }}>
					{ props.track?.type == 'Video'
						? <video playsInline ref={props.videoRef}
							disablePictureInPicture={false}
							width='100%' height='100%'
						/>
						: <Illustration url={props.illustration} fallback={<AudiotrackIcon />} />
					}
				</Grid>
				<Grid item sx={{ width: '100%' }}>
					<Stack spacing={2} sx={{ justifyContent: 'space-evenly' }}>
						<Grid container sx={{
							...playerTextStyle, width: '100%', flexGrow: 1,
							display: 'flex', justifyContent: 'center'
						}}>
							<Grid item xs={1}></Grid>
							<Grid item xs={10} sx={{
								...playerTextStyle, display: 'flex', justifyContent: 'center'
							}}>
								{ props.artist && props.track && <Link href={`/releases/${props.track.releaseId}`} style={{
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
								</Link> }
							</Grid>
							<Grid item xs={1}>
								{props.track && parentSong.data && props.artist && props.release ?
									<ReleaseTrackContextualMenu
										artist={props.artist} release={props.release}
										track={{ ...props.track, song: parentSong.data }}
										onSelect={() => props.onExpand(false)}
									/> :
									<IconButton><MoreVert/></IconButton>
									// To avoid slight shift on loaded
								}
							</Grid>
						</Grid>
						<Box sx={{ display: 'flex', justifyContent: 'center' }}>
							{ props.track && props.artist &&
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
							}
						</Box>
						<Stack spacing={2} sx={{ justifyContent: "center", display: 'flex' }} direction='row'>
							<PreviousButton onClick={props.onRewind}/>
							<PlayButton
								onPause={props.onPause}
								onPlay={props.onPlay}
								isPlaying={props.playing}
							/>
							<SkipButton onClick={props.onSkipTrack}/>
						</Stack>
						<Container maxWidth={false}>
							<PlayerSlider
								onSlide={props.onSlide}
								duration={props.duration}
								progress={props.progress}
							/>
						</Container>
					</Stack>
				</Grid>
			</Grid>
			<Grid item xs={12} lg={5}>
				<Container maxWidth={false}>
					<Tabs
						value={panel}
						onChange={(__, panelName) => setPanel(panelName)}
						variant="fullWidth"
					>
						<Tab key={0} value={'lyrics'} label={'Lyrics'}/>
						<Tab key={1} value={'playlist'} label={'Playlist'}/>
					</Tabs>
					<Box sx={{ paddingY: 2, height: { xs: '100%', lg: '80vh' }, overflowY: 'scroll' }}>
						{ panel == 'lyrics' && props.track && (!parentSong.data ?
							<WideLoadingComponent/> :
							<LyricsBox
								lyrics={parentSong.data.lyrics?.content.split('\n')}
								songName={props.track.name}
							/>)
						}
						{ panel == 'playlist' && <DragDropContext onDragEnd={(result) => {
							if (result.destination) {
								dispatch(reorder({
									from: result.source.index + cursor + 1,
									to: result.destination.index + cursor + 1
								}));
							}
						}}>
							<Droppable droppableId="droppable">{(provided) => <div
								{...provided.droppableProps}
								ref={provided.innerRef}
							>
								{playlist.slice(cursor + 1).map((playlistItem, index) => <>
									<Draggable draggableId={index.toString()}
										key={index} index={index}
									>
										{(providedChild) => <div
											ref={providedChild.innerRef}
											{...providedChild.draggableProps}
											style={providedChild.draggableProps.style}
										>
											<ListItem
												title={playlistItem.track.name}
												secondTitle={playlistItem.artist.name}
												icon={<Box {...providedChild.dragHandleProps}>
													<DragHandleIcon/>
												</Box>}
												trailing={<Typography color="text.disabled">
													{formatDuration(playlistItem.track.duration)}
												</Typography>}
												onClick={() => {
													let toSkip = index + 1;

													while (toSkip > 0) {
														dispatch(skipTrack());
														toSkip--;
													}
												}}
											/>
										</div>
										}
									</Draggable>
									<Divider variant="middle"/>
								</>)}
								{provided.placeholder}
							</div>}</Droppable>
						</DragDropContext>}
					</Box>
				</Container>
			</Grid>
		</Grid>
	</Stack>;
};

export { MinimizedPlayerControls, ExpandedPlayerControls };
