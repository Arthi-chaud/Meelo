// eslint-disable-next-line no-restricted-imports
import formatMilliSecondsDuration from "format-duration";

const formatDuration = (seconds?: number) => seconds ? formatMilliSecondsDuration(seconds * 1000) : '--:--';

export default formatDuration;
