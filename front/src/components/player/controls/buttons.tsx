import { FastRewind, Pause, PlayArrow, FastForward } from "@mui/icons-material";
import { IconButton, Grid } from "@mui/material";

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

export default PlayerButtonControls;