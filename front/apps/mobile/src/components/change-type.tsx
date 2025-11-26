import { useMutation } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Toast } from "toastify-react-native";
import type Album from "@/models/album";
import { AlbumType } from "@/models/album";
import type Song from "@/models/song";
import { SongType } from "@/models/song";
import {
	albumTypeToTranslationKey,
	songTypeToTranslationKey,
	videoTypeToTranslationKey,
} from "@/models/utils";
import type Video from "@/models/video";
import { VideoType } from "@/models/video";
import { useAPI, useQueryClient } from "~/api";
import { closeModalAtom, useModal } from "./bottom-modal-sheet";
import { SelectBottomModalContent } from "./bottom-modal-sheet/select";

type ChangeTypeModal<T extends string> = {
	types: readonly T[];
	selectedType?: T;
	translate: (t: T) => TranslationKey;
	onSelect: (t: T) => void;
};

export const useChangeAlbumTypeModal = (album: Album | undefined) => {
	const api = useAPI();
	const { client } = useQueryClient();

	const onSelect = useMutation({
		mutationFn: album
			? (type: AlbumType) => {
					return api.updateAlbum(album.id, { type });
				}
			: undefined,
		onSuccess: () => {
			Toast.success("Update successful!");
			client.invalidateQueries({ queryKey: ["albums"] });
			client.invalidateQueries({ queryKey: [album?.slug] });
			client.invalidateQueries({ queryKey: [album?.id] });
		},
		onError: () => {
			Toast.error("Update failed");
		},
	});
	const { openModal } = useChangeTypeModal({
		types: AlbumType,
		selectedType: album?.type,
		translate: (t) => albumTypeToTranslationKey(t, false),
		onSelect: (t) => onSelect.mutate(t),
	});

	return { openChangeTypeModal: openModal };
};

export const useChangeSongTypeModal = (song: Song | undefined) => {
	const api = useAPI();
	const { client } = useQueryClient();

	const onSelect = useMutation({
		mutationFn: song
			? (type: SongType) => {
					return api.updateSong(song.id, { type });
				}
			: undefined,
		onSuccess: () => {
			Toast.success("Update successful!");
			client.invalidateQueries({ queryKey: ["songs"] });
			client.invalidateQueries({ queryKey: [song?.slug] });
			client.invalidateQueries({ queryKey: [song?.id] });
		},
		onError: () => {
			Toast.error("Update failed");
		},
	});
	const { openModal } = useChangeTypeModal({
		types: SongType,
		selectedType: song?.type,
		translate: (t) => songTypeToTranslationKey(t, false),
		onSelect: (t) => onSelect.mutate(t),
	});

	return { openChangeTypeModal: openModal };
};

export const useChangeVideoTypeModal = (video: Video | undefined) => {
	const api = useAPI();
	const { client } = useQueryClient();

	const onSelect = useMutation({
		mutationFn: video
			? (type: VideoType) => {
					return api.updateVideo(video.id, { type });
				}
			: undefined,
		onSuccess: () => {
			Toast.success("Update successful!");
			client.invalidateQueries({ queryKey: ["videos"] });
			client.invalidateQueries({ queryKey: [video?.slug] });
			client.invalidateQueries({ queryKey: [video?.id] });
			client.invalidateQueries({ queryKey: ["releases"] });
		},
		onError: () => {
			Toast.error("Update failed");
		},
	});
	const { openModal } = useChangeTypeModal({
		types: VideoType,
		selectedType: video?.type,
		translate: (t) => videoTypeToTranslationKey(t, false),
		onSelect: (t) => onSelect.mutate(t),
	});

	return { openChangeTypeModal: openModal };
};

/// Internal

export const useChangeTypeModal = <Type extends string>(
	props: ChangeTypeModal<Type>,
) => {
	const closeModal = useSetAtom(closeModalAtom);
	const content = useCallback(() => {
		if (!props) {
			return null;
		}
		const onSelect: typeof props.onSelect = (e) => {
			props.onSelect(e);
			closeModal();
		};
		return <ChangeTypeModal {...props} onSelect={onSelect} />;
	}, [props, closeModal]);
	const { openModal } = useModal({
		content,
		onDismiss: () => {},
	});
	return { openModal };
};

// We don't dismiss the modal when an item is clicked
export const ChangeTypeModal = <T extends string>({
	types,
	translate,
	onSelect,
	selectedType,
}: ChangeTypeModal<T>) => {
	const [selectedTypeState, setSelectedState] = useState(selectedType);
	const { t } = useTranslation();
	const onPress = useCallback(
		(t: T) => {
			if (t !== selectedTypeState) {
				onSelect(t);
				setSelectedState(t);
			}
		},
		[onSelect, selectedTypeState],
	);
	useEffect(() => {
		setSelectedState(selectedType);
	}, [selectedType]);
	return (
		<SelectBottomModalContent
			values={types}
			onSelect={onPress}
			isSelected={(v) => selectedTypeState === v}
			formatItem={(v) => t(translate(v))}
		/>
	);
};
