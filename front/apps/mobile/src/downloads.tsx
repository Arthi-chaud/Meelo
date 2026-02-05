import {
	completeHandler,
	createDownloadTask,
	directories,
	getExistingDownloadTasks,
	setConfig,
} from "@kesha-antonov/react-native-background-downloader";
import * as FileSystem from "expo-file-system";
import { atom, useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import * as yup from "yup";
import type { QueryClient } from "@/api/hook";
import { store } from "@/state/store";
import { storage } from "~/utils/storage";
import { getAPI, useAPI, useQueryClient } from "./api";

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

const cacheDirectory = `${directories.documents}/media`;

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

const PrefetchKey = "prefetch-count";

const _queuePrefetchCount = atom(storage.getNumber(PrefetchKey) ?? 5);

export const queuePrefetchCountAtom = atom(
	(get) => get(_queuePrefetchCount),
	(_, set, data: number) => {
		set(_queuePrefetchCount, data);
		storage.set(PrefetchKey, data);
	},
);

const MaxCachedCountKey = "max-cached-count";

const _maxCachedCount = atom(storage.getNumber(MaxCachedCountKey) ?? 20);

export const maxCachedCountAtom = atom(
	(get) => get(_maxCachedCount),
	(_, set, data: number) => {
		set(_maxCachedCount, data);
		storage.set(MaxCachedCountKey, data);
	},
);

const __downloads = atom(getPersistedDownloads());

const _downloadsAtom = atom(
	(get) => get(__downloads),
	(_, set, data: Downloads) => {
		set(__downloads, data);
		storage.set(DownloadsKey, JSON.stringify(data));
	},
);

export const downloadsAtom = atom((get) => get(__downloads));

export const DownloadManager = () => {
	const api = useAPI();
	useEffect(() => {
		setConfig({
			maxParallelDownloads: 5,
			isLogsEnabled: process.env.NODE_ENV !== "production",
		});
	}, []);
	useEffect(() => {
		getExistingDownloadTasks().then((tasks) =>
			Promise.all(tasks.map((t) => t.stop())),
		);
		setConfig({ headers: api.getAuthHeaders() });
	}, [api]);
	return null;
};

const deleteOldestFiles = (fileCount: number) => {
	if (fileCount <= 0) {
		return;
	}
	const files = store.get(_downloadsAtom).downloadedFiles;
	const orderedByDate = files.sort(
		(fa, fb) => fa.downloadDate.getTime() - fb.downloadDate.getTime(),
	);
	for (const f of orderedByDate.slice(0, fileCount)) {
		try {
			new FileSystem.File(`file://${f.localPath}`).delete();
		} catch {}
	}
	store.set(_downloadsAtom, {
		downloadedFiles: orderedByDate.slice(fileCount),
	});
};

export const downloadFile =
	(queryClient: QueryClient) => async (sourceFileId: number) => {
		if (
			store
				.get(downloadsAtom)
				.downloadedFiles.find(
					(f) =>
						f.fileId === sourceFileId &&
						f.instanceUrl === queryClient.api.urls.api,
				)
		) {
			return null;
		}

		const dlCount = store.get(_downloadsAtom).downloadedFiles.length;
		const maxDlCount = store.get(maxCachedCountAtom);
		if (dlCount >= maxDlCount) {
			deleteOldestFiles(
				Math.ceil(maxDlCount / 5) + (maxDlCount - dlCount),
			);
		}
		const taskId = sourceFileId.toString();

		const serverHostname = new URL(queryClient.api.urls.api).hostname;
		const destFileName = `${cacheDirectory}/${serverHostname}-${sourceFileId}`;
		const currentTasks = await getExistingDownloadTasks();
		if (currentTasks.find((t) => t.id === taskId)) {
			return null;
		}
		const task = createDownloadTask({
			id: taskId,
			destination: destFileName,
			url: queryClient.api.getDirectStreamURL(sourceFileId),
			metadata: {
				fileId: sourceFileId,
				localPath: destFileName,
				downloadDate: new Date(),
				instanceUrl: queryClient.api.urls.api,
			} satisfies DownloadedFile,
		})
			// biome-ignore lint/suspicious/noConsole: debug
			.error((e) => console.error(`Download error: ${e.error}`))
			.done(() => {
				const dls = store.get(downloadsAtom);
				dls.downloadedFiles.push(task.metadata as DownloadedFile);
				store.set(_downloadsAtom, dls);
				completeHandler(task.id);
			});
		task.start();
		return task;
	};

export const getDownloadStatus = async (
	sourceFileId: number,
): Promise<
	["downloaded", string] | ["downloading" | "not-downloaded", null]
> => {
	const instanceUrl = getAPI().urls.api;
	const downloaded = store
		.get(downloadsAtom)
		.downloadedFiles.find(
			(f) => f.fileId === sourceFileId && instanceUrl === f.instanceUrl,
		);
	if (downloaded) {
		if (!new FileSystem.File(`file://${downloaded.localPath}`).exists) {
			store.set(_downloadsAtom, {
				downloadedFiles: store
					.get(downloadsAtom)
					.downloadedFiles.filter(
						(f) =>
							!(
								f.fileId === sourceFileId &&
								instanceUrl === f.instanceUrl
							),
					),
			});

			return ["not-downloaded", null];
		}
		return ["downloaded", downloaded.localPath];
	}
	const tasks = await getExistingDownloadTasks();
	if (tasks.find((t) => t.id === sourceFileId.toString())) {
		return ["downloading", null];
	}
	return ["not-downloaded", null];
};

const wipeCache = (): Error | null => {
	try {
		new FileSystem.Directory(`file://${cacheDirectory}`).delete();
	} catch (e) {
		return e as Error;
	}
	store.set(_downloadsAtom, { downloadedFiles: [] });
	return null;
};

export const useDownloadManager = () => {
	const queryClient = useQueryClient();
	const download_ = useMemo(() => downloadFile(queryClient), [queryClient]);

	return { download: download_, wipeCache };
};

export const useIsDownloaded = (sourceFileId: number | null | undefined) => {
	const downloads = useAtomValue(downloadsAtom);
	const isDownloaded = useMemo(() => {
		if (!sourceFileId) {
			return false;
		}
		return downloads.downloadedFiles.find((f) => f.fileId === sourceFileId);
	}, [sourceFileId, downloads]);
	return isDownloaded;
};
