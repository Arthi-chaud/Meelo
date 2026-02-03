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
import { getSourceFile } from "@/api/queries";
import { store } from "@/state/store";
import { storage } from "~/utils/storage";
import { getAPI, useQueryClient } from "./api";

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
	const queryClient = useQueryClient();
	// TODO: schedule backgorund that cleans the cache if it's too old?
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
		setConfig({ headers: queryClient.api.getAuthHeaders() });
	}, [queryClient]);
	return null;
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
		const sourceFile = await queryClient
			.fetchQuery(getSourceFile(sourceFileId))
			.catch(() => null);
		if (!sourceFile) {
			return null;
		}
		const fileExtension = sourceFile.path.split(".").at(-1);
		if (!fileExtension) {
			return null;
		}
		const taskId = sourceFile.id.toString();

		const serverHostname = new URL(queryClient.api.urls.api).hostname;
		const destFileName = `${cacheDirectory}/${serverHostname}-${sourceFile.id}.${fileExtension}`;
		const currentTasks = await getExistingDownloadTasks();
		if (currentTasks.find((t) => t.id === taskId)) {
			return null;
		}
		const task = createDownloadTask({
			id: taskId,
			destination: destFileName,
			url: queryClient.api.getDirectStreamURL(sourceFile.id),
			metadata: {
				fileId: sourceFile.id,
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

const getCachedFileCount = () => {
	const dir = new FileSystem.Directory(`file://${cacheDirectory}`);
	if (!dir.exists) {
		return 0;
	}
	try {
		return dir.list().length;
	} catch {
		return 0;
	}
};

export const useDownloadManager = () => {
	const queryClient = useQueryClient();
	const downloads = useAtomValue(downloadsAtom);
	const download_ = useMemo(() => downloadFile(queryClient), [queryClient]);
	const cachedFilesCount = useMemo(
		() => getCachedFileCount(),
		[downloads.downloadedFiles.length],
	);

	return { download: download_, wipeCache, cachedFilesCount };
};
