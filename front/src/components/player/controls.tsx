import { FastForward, FastRewind, Pause, PlayArrow } from "@mui/icons-material";
import { Typography, Grid, Slider, Box, IconButton, ButtonBase, CardActionArea, useTheme } from "@mui/material";
import formatDuration from "../../utils/formatDuration";
import Illustration from "../illustration";
import LoadingComponent from "../loading/loading";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from "react";

type PlayerControlsProps = {
	title?: string;
	artist?: string;
	playing: boolean;
	illustration?: string | null;
	onPause: () => void;
	onPlay: () => void;
	onSkipTrack: () => void;
	onRewind: () => void;
	onStop: () => void;
	onExpand: (expanded: boolean) => void;
	duration?: number;
	progress?: number;
	onScroll: (requestedProgress: number) => void;
}


const DurationComponent = ({time}: { time?: number}) => (
	<Typography>
		{formatDuration(time)}
	</Typography>
)
type PlayerSliderProps = {
	onSlide: (newProgress: number) => void;
	duration?: number;
	progress?: number;
}

const PlayerSlider = (props: PlayerSliderProps) => {
	return <Grid item xs container sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} spacing={2}>
		<Grid item xs="auto">
			<DurationComponent time={props.progress}/>
		</Grid>
		<Grid item xs>
			<Slider
				disabled={!props.duration || props.progress === undefined}
				size="small"
				color="secondary"
				valueLabelDisplay="off"
				onChange={(event) => {
					if (props.duration !== undefined)
						props.onSlide((event.target as any).value / 100 * props.duration)
				}}
				value={ props.duration && props.progress !== undefined
					? props.progress * 100 / (props.duration == 0 ? props.progress : props.duration)
					: 0
				}
			/>
		</Grid>
		<Grid item xs="auto">
			<DurationComponent time={props.duration}/>
		</Grid>
	</Grid>
}

const playerTextStyle = {
	whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center'
}

type PlayerTextProps = {
	artist?: string;
	title?: string;
}

const PlayerText = (props: PlayerTextProps) => {
	return <Box sx={{ flexDirection: 'center' }}>
		<Typography sx={{ fontWeight: 'bold', ...playerTextStyle}}>
			{ props.title }
		</Typography>
		<Typography sx={{ fontWeight: 'light', ...playerTextStyle}}>
			{ props.artist }
		</Typography>
	</Box>
}

type PlayerButtonControlsProps = {
	playing: boolean;
	onPause: () => void;
	onPlay: () => void;
	onSkipTrack: () => void;
	onRewind: () => void;
	onStop: () => void;
}

const PlayerButtonControls = (props: PlayerButtonControlsProps) => {
	return <Grid container sx={{ justifyContent: 'center', width: '100%', display: 'flex' }}>
		{[
			[() => <FastRewind/>, () => props.onRewind()],
			[() => props.playing ? <Pause/> : <PlayArrow/>, () => props.playing ? props.onPause() : props.onPlay()],
			[() => <FastForward/>, () => props.onSkipTrack()]
		].map((button, index) => (
			<Grid item xs="auto" key={index}>
				<IconButton onClick={button[1] as () => void} color='inherit'>
					{(button[0] as () => JSX.Element)()}
				</IconButton>
			</Grid>
		))}
	</Grid>
}

const PlayerControls = (props: PlayerControlsProps) => {
	const theme = useTheme();
	return <Grid container spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-evenly', padding: 1 }}>
		<Grid item xs={1.5} sm={1.25} md={0.75} lg={0.6} xl={0.5} sx={{ alignContent: 'center' }}>
			<CardActionArea onClick={() => props.onExpand(true)} sx={{ borderRadius: theme.shape.borderRadius }}>
				{ props.illustration
					? <Illustration url={props.illustration} fallback={<AudiotrackIcon/>}/>
					: <AudiotrackIcon/>
				}
			</CardActionArea>
		</Grid>
		<Grid item container sx={{ flexDirection: 'column'}} xs={6}>
			<PlayerText artist={props.artist} title={props.title}/>
			<PlayerSlider onSlide={props.onScroll} duration={props.duration} progress={props.progress}/>
		</Grid>
		<Grid item xs='auto'>
			<PlayerButtonControls {...props}/>
		</Grid>
		<Grid item xs='auto'>
			<IconButton onClick={props.onStop}>
				<CloseIcon/>
			</IconButton>
		</Grid>
	</Grid>
}

const ExpandedPlayerControls = (props: PlayerControlsProps) => {
	return <Grid container spacing={3} direction="column" sx={{ display: 'flex', height: '100%', padding: 2, justifyContent: 'space-between'}}>
		<Grid item xs='auto' sx={{ justifyContent: 'flex-end', width: '100%', display: 'flex'}}>
			<IconButton onClick={() => props.onExpand(false)}>
				<CloseIcon/>
			</IconButton>
		</Grid>
		<Grid item xs sx={{ justifyContent: 'center', alignContent: 'center', display: 'flex'}}>
			<Illustration url={props.illustration ?? null} fallback={<AudiotrackIcon/>}/>
		</Grid>
		<Grid item xs={3} container direction="column" sx={{ justifyContent: 'space-evenly', display: 'flex'}}>
			<Grid item>
				<PlayerText artist={props.artist} title={props.title}/>
			</Grid>
			<Grid item>
				<PlayerButtonControls {...props}/>
			</Grid>
			<Grid item>
				<PlayerSlider onSlide={props.onScroll} duration={props.duration} progress={props.progress}/>
			</Grid>
		</Grid>
	</Grid>
}


export { PlayerControls, ExpandedPlayerControls };