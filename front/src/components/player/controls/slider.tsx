import { Slider, Grid} from "@mui/material";
import DurationComponent from "./duration";

type PlayerSliderProps = {
	onSlide: (newProgress: number) => void;
	duration?: number;
	progress?: number;
}

const PlayerSlider = (props: PlayerSliderProps) => {
	return <Grid container sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} spacing={2}>
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

export default PlayerSlider;