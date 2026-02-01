import { atom } from "jotai";
import { storage } from "~/utils/storage";

export type Downloads = { downloadedFiles: DownloadedFile[] };
export type DownloadedFile = {
	fileId: number;
	downloadDate: Date;
	instanceUrl: string;
	localPath: string;
};

const DownloadsKey = "cache";

const getPersistedDownloads = (): Downloads => {
	try {
		//TODO Validate
		//TODO Check that all the files are still available
		return JSON.parse(storage.getString(DownloadsKey)!);
	} catch {
		return { downloadedFiles: [] };
	}
};

const _downloads = atom(getPersistedDownloads());

export const downloadsAtom = atom(
	(get) => get(_downloads),
	(_, set, data: Downloads) => {
		set(_downloads, data);
		storage.set(DownloadsKey, JSON.stringify(data));
	},
);
