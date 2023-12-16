import { MetadataRefreshIcon } from "../icons";
import API from "../../api/api";
import Action from "./action";
import { translate } from "../../i18n/translate";
import toast from "react-hot-toast";

const RefreshMetadataAction = (
	...params: Parameters<typeof API.refreshMetadata>
): Action => ({
	label: "refreshMetadata",
	icon: <MetadataRefreshIcon />,
	onClick: () =>
		API.refreshMetadata(...params)
			.then(() => toast.success(translate("refreshMetadataStarted")))
			.catch(() => toast.error(translate("refreshMetadataFailed"))),
});

export const RefreshLibraryMetadataAction = (
	librarySlugOrId: number | string,
) => RefreshMetadataAction("library", librarySlugOrId);

export const RefreshAlbumMetadataAction = (albumSlugOrId: number | string) =>
	RefreshMetadataAction("album", albumSlugOrId);

export const RefreshReleaseMetadataAction = (
	releaseSlugOrId: number | string,
) => RefreshMetadataAction("release", releaseSlugOrId);

export const RefreshSongMetadataAction = (songSlugOrId: number | string) =>
	RefreshMetadataAction("song", songSlugOrId);

export const RefreshTrackMetadataAction = (trackSlugOrId: number | string) =>
	RefreshMetadataAction("track", trackSlugOrId);
