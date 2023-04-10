// eslint-disable-next-line no-shadow
enum Task {
	Housekeeping = 'housekeeping',
	Clean = 'clean',
	CleanLibrary = 'cleanLibrary',
	Scan = 'scan',
	UnregisterFile = 'unregisterFile',
	ScanLibrary = 'scanLibrary',
	RefreshMetadata = 'refreshMetadata',
	RefreshLibraryMetadata = 'refreshLibraryMetadata',
	FetchExternalMetadata = 'fetchExternalMetadata'
}

const TasksDescription: Record<Task, string> = {
	unregisterFile: 'Unregister File and related file',
	housekeeping: 'Removes empty parents',
	clean: 'Removes tracks from deleted files',
	cleanLibrary: 'Removes tracks from deleted files in a specific library',
	scan: 'Scan and registers new files',
	scanLibrary: 'Scan and registers new files from a specific library',
	refreshMetadata: "Rescans metadata from files that changed since their registration",
	refreshLibraryMetadata: "Rescans metadata from files in a specific library that changed since their registration",
	fetchExternalMetadata: "Fetches missing metadata from external providers"
} as const;

export default Task;
export { TasksDescription };
