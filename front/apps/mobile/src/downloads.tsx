import {
	completeHandler,
	createDownloadTask,
	directories,
	getExistingDownloadTasks,
	setConfig,
} from "@kesha-antonov/react-native-background-downloader";
import * as FileSystem from "expo-file-system";
import { useEffect, useMemo } from "react";
import type { QueryClient } from "@/api/hook";
import { getSourceFile } from "@/api/queries";
import { store } from "@/state/store";
import { getAPI, useQueryClient } from "./api";
import { type DownloadedFile, downloadsAtom } from "./state/download";
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
		const destFileName = `${directories.documents}/${serverHostname}-${sourceFile.id}.${fileExtension}`;
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
				store.set(downloadsAtom, dls);
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
			store.set(downloadsAtom, {
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

export const useDownloadManager = () => {
	const queryClient = useQueryClient();
	const download_ = useMemo(() => downloadFile(queryClient), [queryClient]);

	return { download: download_ };
};
