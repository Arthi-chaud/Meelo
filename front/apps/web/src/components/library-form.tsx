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
	Grid,
} from "@mui/material";
import { HookTextField, useHookForm } from "mui-react-hook-form-plus";
import { useTranslation } from "react-i18next";
import type Library from "@/models/library";

type LibraryFormFields = Pick<Library, "name" | "path">;

type LibraryFormProps = {
	defaultValues?: LibraryFormFields;
	onClose: () => void;
	onSubmit: (values: LibraryFormFields) => void;
};

const LibraryForm = (props: LibraryFormProps) => {
	const defaultValues = props.defaultValues ?? { name: "", path: "" };
	const { registerState, handleSubmit } = useHookForm({
		defaultValues,
	});
	const { t } = useTranslation();
	const onSubmit = (values: typeof defaultValues) => {
		props.onSubmit(values);
		props.onClose();
	};

	return (
		<>
			<DialogTitle>
				{props.defaultValues ? "Update" : "Create"} Library
			</DialogTitle>
			<form
				onSubmit={handleSubmit(onSubmit)}
				style={{ width: "100%", height: "100%" }}
			>
				<DialogContent>
					<Grid container direction="column" spacing={3}>
						<HookTextField
							{...registerState("name")}
							textFieldProps={{
								autoFocus: true,
								fullWidth: true,
								label: t("form.library.nameOfLibrary"),
							}}
							gridProps={{}}
							rules={{
								required: {
									value: true,
									message: t("form.library.nameIsRequired"),
								},
							}}
						/>
						<HookTextField
							{...registerState("path")}
							textFieldProps={{
								fullWidth: true,
								label: t("form.library.pathOfLibrary"),
								helperText:
									"Path should be relative to the 'DATA_DIR' variable. Use './' if the library path is 'DATA_DIR' ",
							}}
							gridProps={{}}
							rules={{
								required: {
									value: true,
									message: t("form.library.pathIsRequired"),
								},
							}}
						/>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={props.onClose}>{t("form.cancel")}</Button>
					<Button type="submit" color="primary" variant="contained">
						{t(
							props.defaultValues
								? "actions.update"
								: "actions.create",
						)}
					</Button>
				</DialogActions>
			</form>
		</>
	);
};

export default LibraryForm;
