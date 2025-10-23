import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { CreatePlaylistDto, Playlist } from "@/models/playlist";
import { CheckIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import { Button } from "~/primitives/button";
import { CheckBox } from "~/primitives/checkbox";
import { Text } from "~/primitives/text";
import { TextInput } from "~/primitives/text_input";

export const CreateUpdatePlaylistForm = ({
	existingPlaylist,
	afterSave,
}: {
	existingPlaylist?: Playlist;
	afterSave?: (playlist: Playlist) => void;
}) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { dismiss } = useBottomSheetModal();
	const defaultValues: CreatePlaylistDto = {
		name: existingPlaylist?.name ?? "",
		isPublic: existingPlaylist?.isPublic ?? false,
		allowChanges: existingPlaylist?.allowChanges ?? false,
	};
	const [isLoading, setLoading] = useState(false);

	const {
		control,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm({ defaultValues });
	const isPublic = useWatch({ control, name: "isPublic" });

	const onSubmit = useMutation({
		mutationFn: async (data: CreatePlaylistDto) => {
			setLoading(true);
			const action = existingPlaylist
				? queryClient.api.updatePlaylist(existingPlaylist.id, data)
				: queryClient.api.createPlaylist(data);
			return action
				.then((playlist) => {
					setLoading(false);
					afterSave?.(playlist);
					dismiss();
					queryClient.client.invalidateQueries({
						queryKey: ["playlists"],
					});
					if (existingPlaylist) {
						queryClient.client.invalidateQueries({
							queryKey: [
								"playlists",
								existingPlaylist.id.toString(),
							],
						});
					}
				})
				.catch((e) => {
					setLoading(false);
					control.setError(
						"name",
						{
							message:
								e.message ?? t("toasts.library.creationFail"),
						},
						{ shouldFocus: true },
					);
				});
		},
	});
	return (
		<View style={styles.root}>
			<Controller
				control={control}
				name="name"
				rules={{
					required: { value: true, message: "Required" },
				}}
				render={({ field: { onChange, onBlur, value } }) => (
					<TextInput
						placeholder={t("browsing.controls.sort.name")}
						autoFocus
						autoCorrect={false}
						autoCapitalize="none"
						onBlur={onBlur}
						onChangeText={onChange}
						error={errors.name?.message}
						value={value}
					/>
				)}
			/>

			<Controller
				control={control}
				name="isPublic"
				rules={{
					onChange: (event) => {
						if (!event.target.value) {
							setValue("allowChanges", false);
						}
					},
				}}
				render={({ field: { onChange, value } }) => (
					<View style={styles.checkboxRow}>
						<CheckBox onValueChange={onChange} value={value} />
						<Text
							content={t("form.playlist.playlistIsPublic")}
							numberOfLines={1}
						/>
					</View>
				)}
			/>

			<Controller
				control={control}
				name="allowChanges"
				render={({ field: { onChange, value } }) => (
					<View style={styles.checkboxRow}>
						{/* TODO When disabled, checkbox should have secondary color */}
						<CheckBox
							onValueChange={onChange}
							value={value}
							disabled={!isPublic}
						/>
						<Text
							content={t("form.playlist.allowPlaylistChanges")}
							color={!isPublic ? "secondary" : "primary"}
							numberOfLines={1}
						/>
					</View>
				)}
			/>
			<Button
				title={t(
					existingPlaylist ? "actions.update" : "actions.create",
				)}
				width="fitContent"
				icon={CheckIcon}
				containerStyle={styles.saveButtonLabel}
				disabled={isLoading}
				onPress={handleSubmit((dto) => onSubmit.mutate(dto))}
			/>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		padding: theme.gap(1),
		paddingBottom: theme.gap(3),
		width: "100%",
		alignItems: "center",
		gap: theme.gap(1),
	},
	saveButtonLabel: { justifyContent: "center" },
	checkboxRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
}));
