import { useNavigation } from "expo-router";
import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { emptyPlaylistAtom } from "@/state/player";
import { useQueryClient } from "~/api";

export const useResetAllTabs = () => {
	const navigation = useNavigation();

	return useCallback(() => {
		const st = navigation.getState();
		if (!st) {
			return;
		}
		navigation.reset({
			...st,
			history: [],
			routes: st.routes.map((r) => ({
				...r,
				state: undefined,
			})),
		} as any);
	}, [navigation]);
};

export const useOnLeavingInstance = () => {
	const emptyPlaylist = useSetAtom(emptyPlaylistAtom);
	const queryClient = useQueryClient();
	const resetAllTabs = useResetAllTabs();
	return useCallback(() => {
		emptyPlaylist();
		queryClient.client.clear();
		resetAllTabs();
	}, [emptyPlaylist, queryClient, resetAllTabs]);
};
