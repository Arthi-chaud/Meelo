import toast from "react-hot-toast";
import API from "../../api/api";
import LibraryTaskResponse from "../../models/library-task-response";
import Action from "./action";
import { CleanIcon, MetadataRefreshIcon, ScanIcon } from "../icons";

/**
 * Using the resolved value of the task porimise, triggers an appropriate toast
 * @param task the returned promised from an API call to run a task
 */
const handleTask = <T extends LibraryTaskResponse>(task: Promise<T>) =>
	task
		.then(({ status }) => toast.success(status))
		.catch(({ status }) => toast.error(status));

export const ScanAllLibrariesAction: Action = {
	label: "scanLibraries",
	icon: <ScanIcon />,
	onClick: () => handleTask(API.scanLibraries()),
};

export const ScanLibraryAction = (
	librarySlugOrId: number | string,
): Action => ({
	label: "scan",
	icon: ScanAllLibrariesAction.icon,
	onClick: () => handleTask(API.scanLibrary(librarySlugOrId)),
});

export const CleanAllLibrariesAction: Action = {
	label: "cleanLibraries",
	icon: <CleanIcon />,
	onClick: () => handleTask(API.cleanLibraries()),
};

export const CleanLibraryAction = (
	librarySlugOrId: number | string,
): Action => ({
	label: "clean",
	icon: CleanAllLibrariesAction.icon,
	onClick: () => handleTask(API.cleanLibrary(librarySlugOrId)),
});

export const FetchExternalMetadata: Action = {
	label: "fetchMetadata",
	icon: <MetadataRefreshIcon />,
	onClick: () => handleTask(API.fetchExternalMetadata()),
};
