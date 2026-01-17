import {
	Box,
	Button,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	Stack,
} from "@mui/material";
import { HookTextField, useHookForm } from "mui-react-hook-form-plus";
import { useCallback } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	getExternalProviders,
	getResourceExternalMetadata,
} from "@/api/queries";
import { CommonExternalMetadata } from "@/models/external-metadata";
import type {
	CreateExternalMetadataDto,
	MatchableResourceType,
} from "@/models/matcher";
import { store } from "@/state/store";
import {
	AddIcon,
	DeleteIcon,
	EditExternalLinksIcon,
	ProviderIcon,
} from "@/ui/icons";
import { useInfiniteQuery, useQuery, useQueryClient } from "~/api";
import { userAtom } from "~/state/user";
import Illustration from "../illustration";
import type Action from ".";

export const EditExternalLinksAction = (
	resourceType: MatchableResourceType,
	resourceId: number,
): Action => ({
	label: "actions.editExternalLinks",
	disabled: store.get(userAtom)?.admin !== true,
	icon: <EditExternalLinksIcon />,
	dialog: ({ close }) => {
		const { data: oldExternalMetadata } = useQuery(() =>
			getResourceExternalMetadata(
				resourceId,
				resourceType,
				CommonExternalMetadata,
			),
		);
		const queryClient = useQueryClient();
		const onSubmit = useCallback(
			async (links: ValidatedFormField[]) => {
				if (oldExternalMetadata === undefined) {
					return;
				}
				const newMetadata: CreateExternalMetadataDto<CommonExternalMetadata> =
					{
						...(oldExternalMetadata ?? {
							description: null,
							[`${resourceType}Id`]: resourceId,
						}),
						sources: links,
					};
				await queryClient.api.submitExternalMetadata(newMetadata);
				close();
				await queryClient.api.refreshExternalMetadata(
					{
						[`${resourceType}Id` as "artistId"]: resourceId,
					},
					true,
				);
				await queryClient.client.invalidateQueries({
					queryKey: ["api", "external-metadata"],
				});

				await queryClient.client.invalidateQueries({
					queryKey: [`${resourceType}s`, resourceId.toString()],
				});
			},
			[oldExternalMetadata],
		);
		return (
			<EditExternalLinksForm
				resourceType={resourceType}
				externalMetadata={oldExternalMetadata}
				onSave={onSubmit}
			/>
		);
	},
});

type Props = {
	onSave: (sources: ValidatedFormField[]) => void;
	resourceType: MatchableResourceType;
	externalMetadata: CommonExternalMetadata | null | undefined;
};

type FormField = { url: string; providerId: number | null };
type ValidatedFormField = { url: string; providerId: number };

const ProviderFormIcon = ({
	providerId,
}: Partial<Pick<FormField, "providerId">>) => {
	const { items } = useInfiniteQuery(() => getExternalProviders());
	const iconId = items?.find((p) => p.id === providerId)?.illustrationId;
	return (
		<Box sx={{ width: 30 }}>
			{providerId !== null && (
				<Illustration
					url={`/illustrations/${iconId}`}
					quality="original"
					fallback={<ProviderIcon />}
				/>
			)}
		</Box>
	);
};

export const EditExternalLinksForm = ({
	onSave,
	resourceType,
	externalMetadata,
}: Props) => {
	const isLoading = externalMetadata === undefined;
	const queryClient = useQueryClient();
	const { control, handleSubmit, registerState } = useHookForm<{
		urls: FormField[];
	}>({
		values: {
			urls: externalMetadata?.sources ?? [{ url: "", providerId: null }],
		},
		mode: "onBlur",
	});
	const urlsState = useWatch({ control, name: "urls" });
	const { fields, remove, append, update } = useFieldArray({
		control,
		name: "urls",
	});
	const { t } = useTranslation();
	const validateField = useCallback(
		async (url: string, index: number) => {
			const res = await queryClient.api.resolveUrl({
				url: url as string,
				resourceType,
			});
			if (res === null) {
				return false;
			}
			const otherIndex = urlsState.findIndex(
				(u) => u.providerId === res.providerId,
			);
			if (otherIndex === -1 || otherIndex === index) {
				update(index, res);
				return true;
			}
			return false;
		},
		[urlsState],
	);

	return (
		<>
			<DialogTitle>{t("actions.editExternalLinks")}</DialogTitle>
			<form
				onSubmit={handleSubmit(({ urls }) => {
					onSave(
						// NOTE: Urls shouldn't be filtered out
						urls.filter(
							(u): u is ValidatedFormField =>
								u.providerId !== null,
						),
					);
				})}
				style={{ width: "100%", height: "100%" }}
			>
				<DialogContent>
					<Stack spacing={2}>
						{fields.map((field, index) => (
							<Stack
								direction="row"
								spacing={2}
								key={`${field.id}-${index}-${field.providerId}`}
								sx={{ alignItems: "center" }}
							>
								<ProviderFormIcon
									providerId={field.providerId}
								/>
								<HookTextField
									{...registerState(`urls.${index}.url`)}
									textFieldProps={{
										fullWidth: true,
										label: "URL",
										disabled: isLoading,
									}}
									rules={{
										required: true,
										validate: (f) =>
											validateField(f as string, index),
									}}
								/>
								<IconButton
									disabled={isLoading}
									onClick={() => remove(index)}
									color="error"
								>
									<DeleteIcon />
								</IconButton>
							</Stack>
						))}

						<Button
							onClick={() =>
								append({ url: "", providerId: null })
							}
							startIcon={<AddIcon />}
							disabled={isLoading}
							variant="contained"
						>
							{t("form.editExternalLinks.addLink")}
						</Button>
						<Divider />
						<Button
							type="submit"
							variant="contained"
							disabled={
								isLoading ||
								!!urlsState.find((u) => u.providerId === null)
							}
						>
							{t("form.editExternalLinks.saveLinks")}
						</Button>
					</Stack>
				</DialogContent>
			</form>
		</>
	);
};
