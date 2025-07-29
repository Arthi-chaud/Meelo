import { ShareIcon } from "@/ui/icons";
import { useCallback } from "react";
import { Share } from "react-native";
import type { Action } from "~/actions";
import { useAPI } from "~/api";

export const useShareCallback = () => {
	const api = useAPI();

	return useCallback(
		(route: string) =>
			Share.share({ url: `${api.urls.api.replace("/api", "")}${route}` }),
		[api],
	);
};

export const ShareAction = (callback: () => void): Action => ({
	label: "actions.share",
	icon: ShareIcon,
	onPress: callback,
});
