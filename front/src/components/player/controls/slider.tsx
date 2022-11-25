import { Grid, Slider } from "@mui/material";
import DurationComponent from "./duration";

type PlayerSliderProps = {
	onSlide: (newProgress: number) => void;
	duration?: number;
	progress?: number;
}

const PlayerSlider = (props: PlayerSliderProps) => {
	return <Grid container spacing={2} sx={{
		display: 'flex', justifyContent: 'space-between',
		alignItems: 'center'
	}}>
		<Grid item xs="auto">
			<DurationComponent time={props.progress}/>
		</Grid>
		<Grid item xs>
			<Slider
				style={{ paddingBottom: 0 }}
				disabled={!props.duration || props.progress === undefined}
				size="small"
				color="secondary"
				valueLabelDisplay="off"
				onChange={(event) => {
					if (props.duration !== undefined) {
						const target: any = event.target;

						props.onSlide(target.value / 100 * props.duration);
					}
				}}
				value={props.duration && props.progress !== undefined
					? props.progress * 100 / (props.duration == 0 ? props.progress : props.duration)
					: 0
				}
			/>
		</Grid>
		<Grid item xs="auto">
			<DurationComponent time={props.duration}/>
		</Grid>
	</Grid>;
};

export default PlayerSlider;
