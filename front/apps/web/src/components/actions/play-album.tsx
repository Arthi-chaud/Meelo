import type { QueryClient } from "@/api/hook";
import { getReleaseTracklist } from "@/api/queries";
import { transformPage } from "@/api/query";
import { playFromInfiniteQuery } from "@/state/player";
import { store } from "@/state/store";
import { PlayIcon } from "@/ui/icons";
import type Action from ".";

const ActionBase = { icon: <PlayIcon /> };

export const PlayReleaseAction = (
	releaseId: string | number,
	queryClient: QueryClient,
) =>
	({
		...ActionBase,
		label: "actions.playback.play",
		onClick: () => {
			const query = getReleaseTracklist(releaseId, false, [
				"artist",
				"illustration",
			]);
			store.set(
				playFromInfiniteQuery,
				transformPage(query, ({ song, video, ...track }) => ({
					artist: (song ?? video)!.artist,
					track,
					id: track.id,
				})),
				queryClient,
			);
		},
	}) satisfies Action;
