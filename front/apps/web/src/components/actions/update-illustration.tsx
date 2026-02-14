/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	Button,
	DialogActions,
	DialogContent,
	DialogTitle,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { HookTextField, useHookForm } from "mui-react-hook-form-plus";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import type { QueryClient } from "@/api/hook";
import { store } from "@/state/store";
import { UpdateIllustrationIcon } from "@/ui/icons";
import { userAtom } from "~/state/user";
import type Action from "./";

type IllustrationUpdateFormType = {
	onSubmit: (newUrl: string) => void;
	onClose: () => void;
};

const IllustrationUpdateForm = (props: IllustrationUpdateFormType) => {
	const defaultValues = { url: "" };
	const { t } = useTranslation();
	const { registerState, handleSubmit } = useHookForm({
		defaultValues,
	});
	const onSubmit = (values: typeof defaultValues) => {
		props.onSubmit(values.url);
		props.onClose();
	};

	return (
		<>
			<DialogTitle>Update Illustration</DialogTitle>
			<form
				onSubmit={handleSubmit(onSubmit)}
				style={{ width: "100%", height: "100%" }}
			>
				<DialogContent>
					<HookTextField
						{...registerState("url")}
						textFieldProps={{
							autoFocus: true,
							fullWidth: true,
							label: t("form.illustration.url"),
						}}
						gridProps={{}}
						rules={{
							required: {
								value: true,
								message: "URL is required",
							},
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={props.onClose}>{t("form.cancel")}</Button>
					<Button type="submit">{t("actions.update")}</Button>
				</DialogActions>
			</form>
		</>
	);
};

const UpdateIllustrationAction = (
	queryClient: QueryClient,
	resourceId: number,
	resourceType: "artist" | "track" | "release" | "playlist",
): Action => {
	const mutation = useMutation({
		mutationFn: async (newUrl: string) => {
			const updator =
				resourceType === "artist"
					? queryClient.api.updateArtistIllustration
					: resourceType === "release"
						? queryClient.api.updateReleaseIllustration
						: resourceType === "playlist"
							? queryClient.api.updatePlaylistIllustration
							: queryClient.api.updateTrackIllustration;

			return updator
				.call(queryClient.api, resourceId, newUrl)
				.then(() => {
					toast.success("Illustration updated!");
					queryClient.client.invalidateQueries({
						queryKey: [resourceType],
					});
					queryClient.client.invalidateQueries({
						queryKey: [`${resourceType}s`],
					});
				})
				.catch(() => toast.error("Illustration update failed"));
		},
	});

	return {
		label: "actions.changeIllutration",
		disabled: store.get(userAtom)?.admin !== true,
		icon: <UpdateIllustrationIcon />,
		dialog: (controls) => (
			<IllustrationUpdateForm
				onClose={controls.close}
				onSubmit={(url) => mutation.mutate(url)}
			/>
		),
	};
};

const UpdateArtistIllustrationAction = (
	queryClient: QueryClient,
	artistId: number,
) => UpdateIllustrationAction(queryClient, artistId, "artist");

const UpdateReleaseIllustrationAction = (
	queryClient: QueryClient,
	releaseId: number,
) => UpdateIllustrationAction(queryClient, releaseId, "release");

const UpdateTrackIllustrationAction = (
	queryClient: QueryClient,
	trackId: number,
) => UpdateIllustrationAction(queryClient, trackId, "track");

const UpdatePlaylistIllustrationAction = (
	queryClient: QueryClient,
	playlistId: number,
) => UpdateIllustrationAction(queryClient, playlistId, "playlist");

export {
	UpdateArtistIllustrationAction,
	UpdateReleaseIllustrationAction,
	UpdateTrackIllustrationAction,
	UpdatePlaylistIllustrationAction,
};
