export type MediaControls = {
	updateMediaControlsState: (
		isPlaying?: boolean,
		progress?: number,
	) => Promise<void>;
};
