import { BottomSheetFlatList, useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import { Toast } from "toastify-react-native";
import type { AddToPlaylistPayload } from "@/api";
import { getPlaylists } from "@/api/queries";
import { AddIcon, PlaylistIcon } from "@/ui/icons";
import { generateArray } from "@/utils/gen-list";
import { useQuery, useQueryClient } from "~/api";
import { useModal } from "~/components/bottom-modal-sheet";
import type { ContextMenuItem } from "~/components/context-menu";
import { ListItem } from "~/components/item/list-item";
import { PlaylistItem } from "~/components/item/resource/playlist";
import { Divider } from "~/primitives/divider";
import { Text } from "~/primitives/text";
import { useCreatePlaylistFormModal } from "./playlist/create-update";

export const useAddToPlaylistAction = (
	payload?: AddToPlaylistPayload,
): ContextMenuItem => {
	const content = useCallback(() => {
		if (!payload) {
			return null;
		}
		return <ChoosePlaylistModal payload={payload} />;
	}, [payload]);
	const { openModal } = useModal({
		content,
		onDismiss: () => {},
	});
	return {
		label: "actions.addToPlaylist.label",
		icon: PlaylistIcon,
		onPress: openModal,
		nestedModal: true,
	};
};

const ChoosePlaylistModal = ({
	payload,
}: {
	payload: AddToPlaylistPayload;
}) => {
	const { t } = useTranslation();
	const { dismiss } = useBottomSheetModal();
	const addToPlaylist = useMutation({
		mutationFn: (playlistId: number) =>
			queryClient.api
				.addToPlaylist(payload, playlistId)
				.then(() => {
					Toast.success(t("toasts.playlist.addedToPlaylist"));
					dismiss();
					queryClient.client.invalidateQueries({
						queryKey: ["playlists"],
					});
				})
				.catch((e) => Toast.error(t(e.message ?? ""))),
	});
	const { openFormModal } = useCreatePlaylistFormModal(undefined, (p) =>
		addToPlaylist.mutate(p.id),
	);
	const { data: playlists } = useQuery(() => {
		const q = getPlaylists({ changeable: true }, { sortBy: "name" }, [
			"illustration",
		]);
		return {
			key: [...q.key, "full"],
			exec: (api) => () => q.exec(api)({ pageSize: 100 }),
		};
	});
	const queryClient = useQueryClient();
	return (
		<BottomSheetFlatList
			style={styles.root}
			contentContainerStyle={styles.list}
			ListHeaderComponent={
				<>
					<Text
						content={t("actions.addToPlaylist.modalTitle")}
						variant="h4"
					/>
					<ListItem
						title={t("actions.new")}
						illustration={null}
						illustrationProps={{ fallbackIcon: AddIcon }}
						subtitle={null}
						onPress={openFormModal}
					/>
					<Divider h />
				</>
			}
			data={playlists?.items ?? generateArray(3)}
			renderItem={({ item: playlist }) => (
				<PlaylistItem
					playlist={playlist}
					onPress={() =>
						playlist && addToPlaylist.mutate(playlist.id)
					}
				/>
			)}
		/>
	);
};

const styles = StyleSheet.create((theme, rt) => ({
	root: {
		height: (2 * rt.screen.height) / 3,
		width: "100%",
	},
	list: { paddingBottom: theme.gap(2) },
}));
