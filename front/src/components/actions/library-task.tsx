/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
