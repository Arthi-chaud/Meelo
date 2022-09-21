import { FastForward, FastRewind, Pause, PlayArrow } from "@mui/icons-material";
import AspectRatio from "@mui/joy/AspectRatio";
import { Typography, Grid, Slider, LinearProgress, IconButton } from "@mui/material";
import Illustration from "../illustration";

type PlayerControlsProps = {
	illustration: JSX.Element;
	title: string;
	artist: string;
	playing: boolean;
	onPause: () => void;
	onPlay: () => void;
	onSkipTrack: () => void;
	onRewind: () => void;
	duration: number;
	progress: number;
	onScroll: (requestedProgress: number) => void;
}

const PlayerControls = (props: PlayerControlsProps) => {
	return <Grid container spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-evenly' }}>
		<Grid item container sx={{ flexDirection: 'column' }} xs={6} spacing={2}>
			<Grid item xs sx={{ display: 'flex', justifyContent: 'center' }}>
				<Typography sx={{ textAlign: 'center' }}>
					{props.title} - {props.artist}
				</Typography>
			</Grid>
			<Grid item xs>
				<LinearProgress
					color="inherit"
					variant="determinate"
					value={props.progress * 100 / (props.duration == 0 ? props.progress : props.duration)}
				/>
			</Grid>
		</Grid>
		<Grid item container xs='auto' sx={{ justifyContent: 'center' }}>
			<Grid item xs="auto">
				<IconButton onClick={() => props.onRewind()}>
					<FastRewind/>
				</IconButton>
			</Grid>
			<Grid item xs="auto">
				<IconButton onClick={() => props.playing ? props.onPause() : props.onPlay()}>
					{ props.playing ? <PlayArrow/> : <Pause/> }
				</IconButton>
			</Grid>
			<Grid item xs="auto">
				<IconButton onClick={() => props.onSkipTrack()}>
					<FastForward/>
				</IconButton>
			</Grid>
		</Grid>
	</Grid>
}

export default PlayerControls;