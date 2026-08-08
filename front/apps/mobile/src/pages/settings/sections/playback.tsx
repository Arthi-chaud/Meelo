import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AudioQualities, type AudioQuality } from "@/models/streaming";
import { store } from "@/state/store";
import { MoreIcon } from "@/ui/icons";
import { closeModalAtom, useModal } from "~/components/bottom-modal-sheet";
import { SelectBottomModalContent } from "~/components/bottom-modal-sheet/select";
import { Button } from "~/primitives/button";
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

	return (
		<Section>
			<SectionHeader title={"settings.streaming.header"} />
			{Object.entries(streamingSettings).map(([key, value]) => {
				const networkMode = key as NetworkMode;
				const quality = value as StreamingQuality;

				return (
					<SectionRow
						key={networkMode}
						heading={
							<SectionRowTitle
								title={`settings.streaming.${networkMode}`}
							/>
						}
						action={
							<>
								<Text
									content={
										quality.audio === "original"
											? t("settings.streaming.original")
											: quality.audio
									}
									variant="thirdTitle"
									color="secondary"
								/>
								<Button
									size="small"
									icon={MoreIcon}
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
