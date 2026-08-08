import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AudioQualities, type AudioQuality } from "@/models/streaming";
import { store } from "@/state/store";
import { CheckIcon, CloseIcon, MoreIcon, RetryIcon } from "@/ui/icons";
import { closeModalAtom, useModal } from "~/components/bottom-modal-sheet";
import { SelectBottomModalContent } from "~/components/bottom-modal-sheet/select";
import { useTranscoderIsAvailable } from "~/hooks/streaming";
import { Button } from "~/primitives/button";
import { Icon } from "~/primitives/icon";
import { Text } from "~/primitives/text";
import {
	type NetworkMode,
	type StreamingQuality,
	streamingPreferenceAtom,
} from "~/state/streaming";
import {
	Section,
	SectionHeader,
	SectionRow,
	SectionRowTitle,
} from "../components";

export const PlaybackSettings = () => {
	const [streamingSettings] = useAtom(streamingPreferenceAtom);
	const { t } = useTranslation();
	const { openModal } = usePickStreamingQualityModal();
	const { isAvailable: isHLSAvailable, refresh } = useTranscoderIsAvailable();

	return (
		<Section>
			<SectionHeader title={"settings.streaming.header"} />
			<SectionRow
				heading={
					<SectionRowTitle title="settings.streaming.transcoderAvailable" />
				}
				action={
					<>
						<Icon icon={isHLSAvailable ? CheckIcon : CloseIcon} />
						<Button
							size="small"
							icon={RetryIcon}
							onPress={() => refresh()}
						/>
					</>
				}
			/>
			{Object.entries(streamingSettings).map(([key, value]) => {
				const networkMode = key as NetworkMode;
				const quality = value as StreamingQuality;

				return (
					<SectionRow
						key={networkMode}
						heading={
							<SectionRowTitle
								title={`settings.streaming.${networkMode}`}
								textProps={{
									color: !isHLSAvailable
										? "secondary"
										: undefined,
								}}
							/>
						}
						action={
							<>
								<Text
									content={
										isHLSAvailable
											? translateAudioQuality(
													quality.audio,
													t,
												)
											: translateAudioQuality(
													"original",
													t,
												)
									}
									variant="thirdTitle"
									color="secondary"
								/>
								<Button
									size="small"
									icon={MoreIcon}
									disabled={!isHLSAvailable}
									onPress={() => openModal(networkMode)}
								/>
							</>
						}
					/>
				);
			})}
		</Section>
	);
};

export const usePickStreamingQualityModal = () => {
	const closeModal = useSetAtom(closeModalAtom);
	const { t } = useTranslation();
	const content = useCallback(
		(networkMode: NetworkMode) => {
			const prefs = store.get(streamingPreferenceAtom);
			const onSelect = (e: AudioQuality) => {
				store.set(streamingPreferenceAtom, {
					...prefs,
					[networkMode]: { audio: e },
				});
				closeModal();
			};
			return (
				<SelectBottomModalContent
					selected={prefs[networkMode].audio}
					isSelected={(a, b) => a === b}
					values={AudioQualities}
					onItemSelect={(q) => q}
					formatItem={(q) =>
						q === "original" ? t("settings.streaming.original") : q
					}
					onSave={onSelect}
					closeOnSelect
				/>
			);
		},
		[closeModal],
	);
	const { openModal } = useModal<[NetworkMode]>({
		content,
		onDismiss: () => {},
	});
	return { openModal };
};

const translateAudioQuality = (
	q: AudioQuality,
	t: (s: TranslationKey) => string,
) => (q === "original" ? t("settings.streaming.original") : q);
