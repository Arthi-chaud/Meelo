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
import Library from "../models/library";
import { HookTextField, useHookForm } from "mui-react-hook-form-plus";
import Translate, { translate, useLanguage } from "../i18n/translate";
import { useMemo } from "react";

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
	const language = useLanguage();
	const onSubmit = (values: typeof defaultValues) => {
		props.onSubmit(values);
		props.onClose();
	};
	const [nameIsRequired, pathIsRequired] = useMemo(
		() => [translate("nameIsRequired"), translate("pathIsRequired")],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[language],
	);

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
								label: (
									<Translate translationKey="nameOfLibrary" />
								),
							}}
							gridProps={{}}
							rules={{
								required: {
									value: true,
									message: nameIsRequired,
								},
							}}
						/>
						<HookTextField
							{...registerState("path")}
							textFieldProps={{
								fullWidth: true,
								label: (
									<Translate translationKey="pathOfLibrary" />
								),
							}}
							gridProps={{}}
							rules={{
								required: {
									value: true,
									message: pathIsRequired,
								},
							}}
						/>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={props.onClose}>
						<Translate translationKey="cancel" />
					</Button>
					<Button type="submit" color="primary" variant="contained">
						<Translate
							translationKey={
								props.defaultValues ? "update" : "create"
							}
						/>
					</Button>
				</DialogActions>
			</form>
		</>
	);
};

export default LibraryForm;
