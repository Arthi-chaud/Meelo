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

import { Button, Divider, Grid } from "@mui/material";
import { HookTextField, useHookForm } from "mui-react-hook-form-plus";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import API from "../../api/api";
import { setAccessToken } from "../../state/userSlice";
import { useTranslation } from "react-i18next";

/**
 * Authentication form
 * On successful authentication, update store with access token
 */
const AuthenticationForm = () => {
	const dispatch = useDispatch();
	const [formType, setFormType] = useState<"login" | "signup">("login");
	const defaultValues = { username: "", password: "", confirm: "" };
	const [password, setPassword] = useState(defaultValues.password);
	const { registerState, handleSubmit } = useHookForm({
		defaultValues,
	});
	const { t } = useTranslation();

	const onSubmit = async (values: typeof defaultValues) => {
		try {
			if (formType === "signup") {
				const createdUser = await API.register(values);

				if (!createdUser.enabled) {
					setFormType("login");
					toast.success(t("accountCreated"));
					return;
				}
			}
			dispatch(setAccessToken((await API.login(values)).access_token));
		} catch (error: any) {
			toast.error(error.message);
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			style={{ width: "100%", height: "100%" }}
		>
			<Grid
				container
				direction="column"
				spacing={3}
				sx={{
					display: "flex",
					height: "100%",
					width: "100%",
					justifyContent: "center",
					alignItems: "center",
					flexWrap: "nowrap",
				}}
			>
				<HookTextField
					{...registerState("username")}
					textFieldProps={{
						label: t("username"),
					}}
					gridProps={{}}
					rules={{
						required: {
							value: true,
							message: t("usernameIsRequired"),
						},
						minLength: {
							value: 4,
							message: t("usernameTooShort"),
						},
					}}
				/>
				<HookTextField
					{...registerState("password")}
					textFieldProps={{
						label: t("password"),
						type: "password",
						onChange: (event) => setPassword(event.target.value),
					}}
					gridProps={{}}
					rules={{
						required: {
							value: true,
							message: t("passwordIsRequired"),
						},
						minLength: {
							value: 6,
							message: t("passwordTooShort"),
						},
					}}
				/>
				{formType === "signup" && (
					<HookTextField
						{...registerState("confirm")}
						textFieldProps={{
							label: t("confirmPassword"),
							type: "password",
						}}
						gridProps={{}}
						rules={{
							required: {
								value: true,
								message: t("pleaseConfirm"),
							},
							validate: (confirmValue) => {
								if (confirmValue !== password) {
									return t("passwordsAreDifferent");
								}
							},
						}}
					/>
				)}
				<Grid item>
					<Button
						type="submit"
						variant="contained"
						onClick={() => {}}
					>
						{formType === "login" ? "Login" : "Signup"}
					</Button>
				</Grid>
				<Divider sx={{ width: "100%", paddingY: 1 }} variant="middle" />
				<Grid item>
					<Button
						variant="outlined"
						onClick={() =>
							setFormType(
								formType === "login" ? "signup" : "login",
							)
						}
					>
						{t(
							formType === "login"
								? "signupButton"
								: "signinButton",
						)}
					</Button>
				</Grid>
			</Grid>
		</form>
	);
};

export default AuthenticationForm;
