import formatMilliSecondsDuration from "format-duration";

const formatDuration = (seconds: number) => formatMilliSecondsDuration(seconds * 1000);

export default formatDuration;