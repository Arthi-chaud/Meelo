import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AudioQualities, type AudioQuality } from "@/models/streaming";
import { CheckIcon, MoreIcon, RetryIcon, UncheckIcon } from "@/ui/icons";
import { closeModalAtom, useModal } from "~/components/bottom-modal-sheet";
import { SelectBottomModalContent } from "~/components/bottom-modal-sheet/select";
import {
	useStreamingPreferences,
	useTranscoderIsAvailable,
} from "~/hooks/streaming";
import { Button } from "~/primitives/button";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import type { NetworkMode, StreamingQuality } from "~/state/streaming";
import {
	Section,
	SectionHeader,
	SectionRow,
	SectionRowTitle,
} from "../components";

export const PlaybackSettings = () => {
	const [
		{ allowTranscoding, ...streamingPreferences },
		setStreamingPreferences,
	] = useStreamingPreferences();
	const { t } = useTranslation();
	const { openModal } = usePickStreamingQualityModal();
	const { isAvailable: isHLSAvailable, refresh } = useTranscoderIsAvailable();
	const enableTranscodingSettings = isHLSAvailable && allowTranscoding;

	return (
		<Section>
			<SectionHeader title={"settings.streaming.header"} />
			<SectionRow
				heading={
					<SectionRowTitle title="settings.streaming.transcoderAvailable" />
				}
				action={
					<>
						<Text
							content={
								isHLSAvailable ? t("misc.yes") : t("misc.no")
							}
							variant="thirdTitle"
							color="secondary"
						/>
						<Button
							size="small"
							icon={RetryIcon}
							onPress={() => refresh()}
						/>
					</>
				}
			/>

			<SectionRow
				heading={
					<SectionRowTitle title="settings.streaming.allowTranscoding" />
				}
				action={
					<Pressable
						onPress={() =>
							setStreamingPreferences({
								...streamingPreferences,
								allowTranscoding: !allowTranscoding,
							})
						}
					>
						<Icon
							variant={allowTranscoding ? "Bold" : "Outline"}
							icon={allowTranscoding ? CheckIcon : UncheckIcon}
						/>
					</Pressable>
				}
			/>
			{allowTranscoding
				? Object.entries(streamingPreferences).map(([key, value]) => {
						const networkMode = key as NetworkMode;
						const quality = value as StreamingQuality;

						return (
							<SectionRow
								key={networkMode}
								heading={
									<SectionRowTitle
										title={`settings.streaming.${networkMode}`}
										textProps={{
											color: !enableTranscodingSettings
												? "secondary"
												: undefined,
										}}
									/>
								}
								action={
									<>
										<Text
											content={
												enableTranscodingSettings
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
											disabled={
												!enableTranscodingSettings
											}
											onPress={() =>
												openModal(networkMode)
											}
										/>
									</>
								}
							/>
						);
					})
				: null}
		</Section>
	);
};

export const usePickStreamingQualityModal = () => {
	const closeModal = useSetAtom(closeModalAtom);
	const { t } = useTranslation();
	const content = useCallback(
		(networkMode: NetworkMode) => {
			const [prefs, setPrefs] = useStreamingPreferences();
			const onSelect = (q: AudioQuality) => {
				setPrefs({ ...prefs, [networkMode]: { audio: q } });
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
