import { Typography } from "@mui/material";
import formatDuration from "../../../utils/formatDuration";

const DurationComponent = ({ time }: { time?: number }) => (
	<Typography>{formatDuration(time)}</Typography>
);

export default DurationComponent;
