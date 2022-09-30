import { FastForward, FastRewind, Pause, PlayArrow } from "@mui/icons-material";
import { Typography, Grid, Slider, LinearProgress, IconButton } from "@mui/material";
import formatDuration from "../../utils/formatDuration";
import Illustration from "../illustration";
import LoadingComponent from "../loading/loading";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';

type PlayerControlsProps = {
	title?: string;
	artist?: string;
	playing: boolean;
	illustration?: string;
	onPause: () => void;
	onPlay: () => void;
	onSkipTrack: () => void;
	onRewind: () => void;
	duration?: number;
	progress?: number;
	onScroll: (requestedProgress: number) => void;
}

const DurationComponent = ({time}: { time?: number}) => (
	<Typography>
		{formatDuration(time)}
	</Typography>
)

const PlayerControls = (props: PlayerControlsProps) => {
	return <Grid container spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-evenly', padding: 1 }}>
		<Grid item xs={1.5} sm={1.25} md={0.75} lg={0.6} xl={0.5} sx={{ alignContent: 'center' }}>
			{ props.illustration
				? <Illustration url={props.illustration} fallback={<AudiotrackIcon/>}/>
				: <AudiotrackIcon/>
			}
		</Grid>
		<Grid item container sx={{ flexDirection: 'column'}} xs={6}>
			<Grid item xs sx={{ display: 'flex', justifyContent: 'center' }}>
				<Typography sx={{ textAlign: 'center' }}>
					{ props.title && props.artist ? `${props.title} - ${props.artist}` : ''}
				</Typography>
			</Grid>
			<Grid item xs container sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} spacing={2}>
				<Grid item xs="auto">
					<DurationComponent time={props.progress}/>
				</Grid>
				<Grid item xs>
					<Slider
						disabled={!props.duration || !props.title || !props.artist}
						size="small"
						color="secondary"
						valueLabelDisplay="off"
						onChange={(event) => {
							if (props.duration !== undefined)
								props.onScroll((event.target as any).value / 100 * props.duration)
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
		</Grid>
		<Grid item container xs='auto' sx={{ justifyContent: 'center' }}>
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
	</Grid>
}

export default PlayerControls;