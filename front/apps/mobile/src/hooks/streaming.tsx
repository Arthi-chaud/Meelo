import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { getSettings } from "@/api/queries";
import { store } from "@/state/store";
import { useQuery } from "~/api";
import {
	InstanceStreamingPreferences,
	setInstanceStreamingPreferenceAtom,
	streamingPreferenceAtom,
} from "~/state/streaming";
import { currentInstanceAtom } from "~/state/user";

export const useTranscoderIsAvailable = () => {
	const [isAvailable, setIsAvailable] = useState<boolean | null>();
	const { data: settings, refetch } = useQuery(getSettings);
	useEffect(
		() =>
			setIsAvailable(
				!settings || settings.transcoderAvailable === undefined
					? null
					: settings.transcoderAvailable === true,
			),
		[settings],
	);
	return { isAvailable, refresh: refetch };
};

export const useStreamingPreferences = (): [
	InstanceStreamingPreferences,
	(newPrefs: InstanceStreamingPreferences) => void,
] => {
	const currentInstance = useAtomValue(currentInstanceAtom);
	const streamingPreferences = useAtomValue(streamingPreferenceAtom);
	if (!currentInstance) {
		return [InstanceStreamingPreferences.getDefault(), () => {}];
	}
	return [
		streamingPreferences[currentInstance.url] ||
			InstanceStreamingPreferences.getDefault(),
		(newPrefs) =>
			store.set(
				setInstanceStreamingPreferenceAtom,
				currentInstance,
				newPrefs,
			),
	];
};
