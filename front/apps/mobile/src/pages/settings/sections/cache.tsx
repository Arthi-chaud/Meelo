import { useAtom, useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { DeleteIcon, MinusIcon, PlusIcon } from "@/ui/icons";
import {
	downloadsAtom,
	maxCachedCountAtom,
	queuePrefetchCountAtom,
	useDownloadManager,
} from "~/downloads";
import { Button } from "~/primitives/button";
import { Text } from "~/primitives/text";
import { showErrorToast, showSuccessToast } from "~/primitives/toast";
import {
	Section,
	SectionHeader,
	SectionRow,
	SectionRowTitle,
} from "../components";

export const CacheSettings = () => {
	return (
		<Section>
			<SectionHeader title="settings.cache.header" />
			<MaxCachedSettings />
			<PrefetchCountSettings />
			<ClearCachedTracksSettings />
		</Section>
	);
};

const MaxCachedSettings = () => {
	const [maxCachedCount, setMaxCachedCount] = useAtom(maxCachedCountAtom);
	return (
		<SectionRow
			heading={<SectionRowTitle title="settings.cache.maxCachedTracks" />}
			action={
				<>
					<Button
						icon={MinusIcon}
						size="small"
						disabled={maxCachedCount === 20}
						onPress={() =>
							setMaxCachedCount(Math.max(20, maxCachedCount - 5))
						}
					/>
					<Text
						content={maxCachedCount.toString()}
						variant="h5"
						color="secondary"
					/>
					<Button
						icon={PlusIcon}
						size="small"
						disabled={maxCachedCount === 100}
						onPress={() =>
							setMaxCachedCount(Math.min(100, maxCachedCount + 5))
						}
					/>
				</>
			}
		/>
	);
};

const PrefetchCountSettings = () => {
	const [queuePrefetchCount, setQueuePrefetchCount] = useAtom(
		queuePrefetchCountAtom,
	);
	return (
		<SectionRow
			heading={<SectionRowTitle title="settings.cache.prefetchCount" />}
			action={
				<>
					<Button
						icon={MinusIcon}
						size="small"
						disabled={queuePrefetchCount === 0}
						onPress={() =>
							setQueuePrefetchCount(
								Math.max(0, queuePrefetchCount - 1),
							)
						}
					/>
					<Text
						content={queuePrefetchCount.toString()}
						variant="h5"
						color="secondary"
					/>
					<Button
						icon={PlusIcon}
						size="small"
						disabled={queuePrefetchCount === 15}
						onPress={() =>
							setQueuePrefetchCount(
								Math.min(15, queuePrefetchCount + 1),
							)
						}
					/>
				</>
			}
		/>
	);
};

const ClearCachedTracksSettings = () => {
	const { downloadedFiles } = useAtomValue(downloadsAtom);
	const { t } = useTranslation();
	const { wipeCache } = useDownloadManager();
	return (
		<SectionRow
			heading={
				<>
					<SectionRowTitle title="settings.cache.clearCache" />
					<SectionRowTitle
						title={
							`(${downloadedFiles.length.toString()} ${t("models.track_plural")})` as TranslationKey
						}
						textProps={{ color: "secondary" }}
					/>
				</>
			}
			action={
				<Button
					icon={DeleteIcon}
					size="small"
					onPress={() => {
						const err = wipeCache();
						if (err) {
							// biome-ignore lint/suspicious/noConsole: For debug
							console.error(err.message ?? err.toString());
							showErrorToast({
								text: t("toasts.clearCache.error"),
							});
						}
						showSuccessToast({
							text: t("toasts.clearCache.success"),
						});
					}}
				/>
			}
		/>
	);
};
