import { useState } from "react";

export type PrimaryArtistToggleControl = {
	primaryArtistsOnly: boolean | undefined;
	enableToggle: boolean;
	onUpdate: (p: State) => void;
};

type State = { primaryArtistsOnly: boolean | undefined };

export const usePrimaryArtistToggleControl = ({
	defaultValue,
	enableToggle,
	onUpdate,
	hook,
}: {
	hook: () => State | null;
	defaultValue: boolean | undefined;
	enableToggle: boolean;
	onUpdate: PrimaryArtistToggleControl["onUpdate"];
}) => {
	const hookRes = hook();
	const [state, setState] = useState<State>(() => ({
		primaryArtistsOnly: !enableToggle
			? undefined
			: (hookRes?.primaryArtistsOnly ?? defaultValue),
	}));
	const control: PrimaryArtistToggleControl = {
		primaryArtistsOnly: state.primaryArtistsOnly,
		enableToggle: enableToggle,
		onUpdate: (p) => {
			onUpdate(p);
			setState(p);
		},
	};
	return [state, control] as const;
};
