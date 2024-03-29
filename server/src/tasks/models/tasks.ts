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

// eslint-disable-next-line no-shadow
enum Task {
	Housekeeping = "housekeeping",
	Clean = "clean",
	CleanLibrary = "cleanLibrary",
	Scan = "scan",
	UnregisterFile = "unregisterFile",
	ScanLibrary = "scanLibrary",
	RefreshMetadata = "refreshMetadata",
	FetchExternalMetadata = "fetchExternalMetadata",
}

const TasksDescription: Record<Task, string> = {
	unregisterFile: "Unregister File and related file",
	housekeeping: "Removes empty parents",
	clean: "Removes tracks from deleted files",
	cleanLibrary: "Removes tracks from deleted files in a specific library",
	scan: "Scan and registers new files",
	scanLibrary: "Scan and registers new files from a specific library",
	refreshMetadata:
		"Rescans metadata from selected files that changed since their registration",
	fetchExternalMetadata: "Fetches missing metadata from external providers",
} as const;

export default Task;
export { TasksDescription };
