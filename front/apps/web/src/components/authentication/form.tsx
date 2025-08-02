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

import { Box, Button, Divider, Stack } from "@mui/material";
import { useAtom } from "jotai";
import { HookTextField, useHookForm } from "mui-react-hook-form-plus";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { getSettings } from "@/api/queries";
import { useAPI, useQuery } from "~/api";
import { accessTokenAtom } from "~/state/user";

/**
 * Authentication form
 * On successful authentication, update store with access token
 */
const AuthenticationForm = () => {
	const api = useAPI();
	const [formType, setFormType] = useState<"login" | "signup">("login");
	const defaultValues = { username: "", password: "", confirm: "" };
	const [password, setPassword] = useState(defaultValues.password);
	const settings = useQuery(getSettings);
	const [_, setAccessToken] = useAtom(accessTokenAtom);
	const { registerState, handleSubmit } = useHookForm({
		defaultValues,
	});
	const { t } = useTranslation();
	const registrationIsDisabled = useMemo(() => {
		return !settings.data || !settings.data.enableUserRegistration;
	}, [settings.data]);

	const onSubmit = async (values: typeof defaultValues) => {
		try {
			if (formType === "signup") {
				const createdUser = await api.register(values);

				if (!createdUser.enabled) {
					setFormType("login");
					toast.success(t("toasts.auth.accountCreated"));
					return;
				}
			}
			setAccessToken((await api.login(values)).access_token);
		} catch (error: any) {
			toast.error(error.message);
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			style={{ width: "100%", height: "100%" }}
		>
			<Stack
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
						label: t("form.auth.username"),
					}}
					gridProps={{}}
					rules={{
						required: {
							value: true,
							message: t("form.auth.usernameIsRequired"),
						},
						minLength: {
							value: 4,
							message: t("form.auth.usernameTooShort"),
						},
					}}
				/>
				<HookTextField
					{...registerState("password")}
					textFieldProps={{
						label: t("form.auth.password"),
						type: "password",
						onChange: (event) => setPassword(event.target.value),
					}}
					gridProps={{}}
					rules={{
						required: {
							value: true,
							message: t("form.auth.passwordIsRequired"),
						},
						minLength: {
							value: 6,
							message: t("form.auth.passwordTooShort"),
						},
					}}
				/>
				{formType === "signup" && (
					<HookTextField
						{...registerState("confirm")}
						textFieldProps={{
							label: t("form.confirm"),
							type: "password",
						}}
						gridProps={{}}
						rules={{
							required: {
								value: true,
								message: t("form.auth.pleaseConfirm"),
							},
							validate: (confirmValue) => {
								if (confirmValue !== password) {
									return t("form.auth.passwordsAreDifferent");
								}
							},
						}}
					/>
				)}
				<Box>
					<Button
						type="submit"
						variant="contained"
						onClick={() => {}}
					>
						{t(
							formType === "login"
								? "auth.loginButton"
								: "auth.signupButton",
						)}
					</Button>
				</Box>
				<Divider sx={{ width: "100%" }} variant="middle" />
				<Box>
					<Button
						disabled={registrationIsDisabled}
						variant="outlined"
						onClick={() =>
							setFormType(
								formType === "login" ? "signup" : "login",
							)
						}
					>
						{t(
							formType === "login"
								? "auth.signup"
								: "auth.signin",
						)}
					</Button>
				</Box>
			</Stack>
		</form>
	);
};

export default AuthenticationForm;
