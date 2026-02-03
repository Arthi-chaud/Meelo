import { atom } from "jotai";
import * as yup from "yup";
import { storage } from "~/utils/storage";

const DownloadedFile = yup.object({
	fileId: yup.number().required(),
	downloadDate: yup.date().required(),
	instanceUrl: yup.string().required(),
	localPath: yup.string().required(),
});
const Downloads = yup.object({
	downloadedFiles: yup.array(DownloadedFile.required()).required(),
});

export type Downloads = yup.InferType<typeof Downloads>;
export type DownloadedFile = yup.InferType<typeof DownloadedFile>;

const DownloadsKey = "cache";

const getPersistedDownloads = (): Downloads => {
	const stringDls = storage.getString(DownloadsKey);
	if (!stringDls) {
		return { downloadedFiles: [] };
	}
	try {
		const dls = Downloads.validateSync(JSON.parse(stringDls));

		return dls;
	} catch (e) {
		// biome-ignore lint/suspicious/noConsole: For debug
		console.warn(`An error occured when hydrating cache: ${e}`);
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
