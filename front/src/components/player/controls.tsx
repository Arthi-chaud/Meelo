import { FastForward, FastRewind, Pause, PlayArrow } from "@mui/icons-material";
import { Typography, Grid, Slider, Box, IconButton, ButtonBase, CardActionArea, useTheme, Accordion, AccordionDetails, AccordionSummary, Divider, Slide } from "@mui/material";
import formatDuration from "../../utils/formatDuration";
import Illustration from "../illustration";
import LoadingComponent, { WideLoadingComponent } from "../loading/loading";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from "react";
import PlayerButtonControls from "./controls/buttons";
import PlayerSlider from "./controls/slider";
import PlayerText from "./controls/text";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import API from '../../api';
import { useQuery } from "react-query";
import { prepareMeeloQuery } from "../../query";
import LyricsBox from "../lyrics";

const lyricsQuery = (slugOrId: string | number) => ({
	key: ['song', slugOrId, 'lyrics'],
	exec: () => API.getSongLyrics(slugOrId)
});


type PlayerControlsProps =
	Parameters<typeof PlayerSlider>[number] &
	Parameters<typeof PlayerText>[number] &
	Parameters<typeof PlayerButtonControls>[number] &
	{ expanded: boolean, illustration?: string | null, onExpand: (expand: boolean) => void }


const playerTextStyle = {
	whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
}

type ControlButtonProps = {
	icon: JSX.Element;
	onClick: () => void;
}

const ControlButton = (props: ControlButtonProps) => (
	<IconButton onClick={props.onClick} color='inherit'>
		{props.icon}
	</IconButton>
)

const PlayButton = (props: { isPlaying: boolean, onPause: () => void, onPlay: () => void }) => (
	<ControlButton
		icon={props.isPlaying ? <Pause/> : <PlayArrow/>}
		onClick={props.isPlaying ? props.onPause : props.onPlay}
	/>
);

const SkipButton = (props: Omit<ControlButtonProps, 'icon'>) => (
	<ControlButton {...props} icon={<FastForward/>} />
);

const PreviousButton = (props: Omit<ControlButtonProps, 'icon'>) => (
	<ControlButton {...props} icon={<FastRewind/>} />
);

const MinimizedPlayerControls = (props: PlayerControlsProps) => {
	return <ButtonBase onClick={() => props.onExpand(true)} disableTouchRipple sx={{ width: '100%', height: '100%', padding: 0, margin: 0 }}>
	<Grid container spacing={1} sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', paddingX: 1 }}>
		<Grid item xs={1.5} sm={1} md={0.8} lg={0.6} xl={0.5}>
			{props.track
				? <Illustration url={props.track?.illustration ?? null} fallback={<AudiotrackIcon />} />
				: <Box sx={{ height: '100%', display: 'flex', alignItems: 'center'}}>
					<AudiotrackIcon />
				</Box>
			}
		</Grid>
		<Grid item container xs spacing={0.5} sx={{ overflow: 'hidden', display: 'flex', alignItems: 'space-evenly', marginLeft: { xs: 0, sm: 1 } }}>
			<Grid item sx={{ width: '100%',  display: 'flex', justifyContent: { xs: 'left', md: 'center' }, ...playerTextStyle }}>
				<Typography sx={{ fontWeight: 'bold', ...playerTextStyle }}>
					{props.track?.name}
				</Typography>
			</Grid>
			<Grid item sx={{ display: 'flex', width: '100%', justifyContent: { xs: 'left', md: 'center' }, ...playerTextStyle }}>
				<Typography sx={{ fontWeight: 'light', ...playerTextStyle, fontSize: { xs: 'small', md: 'medium'} }}>
					{props.artist?.name}
				</Typography>
			</Grid>
			<Grid item sx={{ display: { xs: 'none', lg: 'flex' }, width: '90%', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
				<PlayerSlider onSlide={props.onSlide} duration={props.duration} progress={props.progress} />
			</Grid>
		</Grid>
		<Grid item container xs={3} sm={2} onClick={(e) => e.stopPropagation()}>
			<Grid item xs sx={{ display: { xs: 'none', lg: 'block' } }}>
				<PreviousButton onClick={props.onRewind}/>
			</Grid>
			<Grid item xs>
				<PlayButton onPause={props.onPause} onPlay={props.onPlay} isPlaying={props.playing}/>
			</Grid>
			<Grid item xs>
				<SkipButton onClick={props.onSkipTrack}/>
			</Grid>
		</Grid>
	</Grid>
	</ButtonBase>
}

const ExpandedPlayerControls = (props: PlayerControlsProps) => {
	const [lyricsOpen, setLyricsOpen] = useState(true);
	const lyrics = useQuery(prepareMeeloQuery(lyricsQuery, props.track?.songId));
	return <Box sx={{ width: '100%', height: '100%' }}>
		<Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: 2 }}>
			<IconButton onClick={() => props.onExpand(false)}>
				<CloseIcon />
			</IconButton>
		</Box>
		<Grid container direction='column' sx={{ height: '70vh', width: 'inherit', justifyContent: 'space-evenly', alignItems: 'center' }}>
			<Grid item xs={6} sm sx={{ aspectRatio: '1', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
				{props.illustration
					? <Illustration url={props.illustration} fallback={<AudiotrackIcon />} />
					: <Box sx={{ height: '100%', display: 'flex', alignItems: 'center'}}>
						<AudiotrackIcon />
					</Box>
				}
			</Grid>
			<Grid item xs={4} container spacing={2} direction="column" sx={{ width: 'inherit', height: '100%', justifyContent: 'center', alignItems: 'center', display: 'flex', paddingY: 4 }}>
				<Grid item>
					<PlayerText artist={props.artist} track={props.track} />
				</Grid>
				<Grid item>
					<PlayerButtonControls {...props} />
				</Grid>
				<Grid item sx={{ width: '90%' }}>
					<PlayerSlider onSlide={props.onSlide} duration={props.duration} progress={props.progress} />
				</Grid>
			</Grid>
		</Grid>
		<Divider variant="middle"/>
		{ props.track && <Box sx={{ paddingX: 4, paddingBottom: 2 }}>
			<Accordion style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none',backgroundImage: 'none' }} expanded={lyricsOpen} onChange={() => setLyricsOpen(!lyricsOpen)}>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography variant="h6" sx={{ fontWeight: 'bold' }}>Lyrics</Typography>
				</AccordionSummary>
				<AccordionDetails>
					{ lyrics.isLoading
						? <WideLoadingComponent/>
						: <LyricsBox lyrics={lyrics.data} songName={props.track.name}/>
					}
				</AccordionDetails>
			</Accordion>
		</Box>
		}
	</Box>
}


export { MinimizedPlayerControls, ExpandedPlayerControls };