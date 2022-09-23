import { FastForward, FastRewind, Pause, PlayArrow } from "@mui/icons-material";
import AspectRatio from "@mui/joy/AspectRatio";
import { Typography, Grid, Slider, LinearProgress, IconButton } from "@mui/material";
import formatDuration from "../../utils/formatDuration";
import Illustration from "../illustration";
import LoadingComponent from "../loading/loading";

type PlayerControlsProps = {
	title?: string;
	artist?: string;
	playing: boolean;
	onPause: () => void;
	onPlay: () => void;
	onSkipTrack: () => void;
	onRewind: () => void;
	duration?: number;
	progress?: number;
	onScroll: (requestedProgress: number) => void;
}

const PlayerControls = (props: PlayerControlsProps) => {
	return <Grid container spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-evenly' }}>
		<Grid item container sx={{ flexDirection: 'column' }} xs={6}>
			<Grid item xs sx={{ display: 'flex', justifyContent: 'center' }}>
				<Typography sx={{ textAlign: 'center' }}>
					{ props.title && props.artist ? `${props.title} - ${props.artist}` : ''}
				</Typography>
			</Grid>
			<Grid item xs container sx={{ display: 'flex', justifyContent: 'space-between' }}>
				{ [props.progress, props.duration].map((time) => (
					<Grid item xs="auto">
						<Typography>
							{time ? formatDuration(time) : '-:--'}
						</Typography>
					</Grid>
				))}
			</Grid>
			<Grid item xs>
				<LinearProgress
					color="inherit"
					variant="determinate"
					value={ props.duration && props.progress !== undefined
						? props.progress * 100 / (props.duration == 0 ? props.progress : props.duration)
						: 0
					}
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
					{ props.playing ? <Pause/> : <PlayArrow/> }
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