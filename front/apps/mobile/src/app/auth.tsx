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

import { ErrorIcon } from "@/ui/icons";
import { router } from "expo-router";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Toast } from "toastify-react-native";
import { getAPI_ } from "~/api";
import { MeeloBanner } from "~/components/meelo_banner";
import { useRootViewStyle } from "~/hooks/root-view-style";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { Text } from "~/primitives/text";
import { TextInput } from "~/primitives/text_input";
import { accessTokenAtom, instanceUrlAtom } from "~/state/user";

const styles = StyleSheet.create((theme) => ({
	root: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "space-evenly",
	},
	banner: {
		height: 300,
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "flex-end",
	},
	errorContainer: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	errorMsg: {
		maxWidth: "80%",
		color: theme.colors.error,
		textAlign: "center",
	},
	formContainer: {
		display: "flex",
		width: "100%",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		gap: theme.gap(3),
	},
}));

//TODO Handle overflow w/ keyboard

export default function AuthenticationScreen() {
	const { t } = useTranslation();
	const defaultValues = {
		url: "http://192.168.65.1:3000",
		username: "test",
		password: "test1234",
		confirm: "",
	};
	const setAccessToken = useSetAtom(accessTokenAtom);
	const setInstanceUrl = useSetAtom(instanceUrlAtom);
	const [isLoading, setLoading] = useState(false);
	const [errorMsg, setErrorMessage] = useState<string>();

	const [formType, setFormType] = useState<"login" | "signup">("login");
	const safeAreaStyle = useRootViewStyle();
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm({ defaultValues });
	const onSubmit = (data: typeof defaultValues) => {
		const instanceUrl = data.url.replace(/\/$/, "");
		const api = getAPI_(null, instanceUrl);
		setLoading(true);
		if (formType === "signup") {
			api.register({
				username: data.username,
				password: data.password,
			})
				.then(() => {
					Toast.success(t("toasts.auth.accountCreated"));
				})
				.catch((e) => {
					setErrorMessage(e.message ?? e.toString());
				})
				.finally(() => {
					setLoading(false);
				});
		} else {
			api.login({ username: data.username, password: data.password })
				.then(({ access_token }) => {
					setAccessToken(access_token);
					setInstanceUrl(instanceUrl);
					router.replace("/");
				})
				.catch((e) => {
					setErrorMessage(e.message ?? e.toString());
					setLoading(false);
				});
		}
	};
	return (
		<ScrollView contentContainerStyle={[styles.root, safeAreaStyle]}>
			<MeeloBanner style={styles.banner} />
			<View style={styles.formContainer}>
				<Controller
					control={control}
					name="url"
					rules={{
						required: {
							value: true,
							message: t("form.auth.instanceUrlIsRequired"),
						},
					}}
					render={({ field: { onChange, onBlur, value } }) => (
						<TextInput
							placeholder={t("form.auth.instanceUrl")}
							textContentType="URL"
							onBlur={onBlur}
							onChangeText={onChange}
							error={errors.url?.message}
							value={value}
						/>
					)}
				/>

				<Controller
					control={control}
					name="username"
					rules={{
						required: {
							value: true,
							message: t("form.auth.usernameTooShort"),
						},
						minLength: {
							value: 4,
							message: t("form.auth.usernameTooShort"),
						},
					}}
					render={({ field: { onChange, onBlur, value } }) => (
						<TextInput
							placeholder={t("form.auth.username")}
							textContentType="username"
							onBlur={onBlur}
							onChangeText={onChange}
							value={value}
							autoComplete={
								formType === "login" ? "username" : undefined
							}
							error={errors.username?.message}
						/>
					)}
				/>

				<Controller
					control={control}
					name="password"
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
					render={({ field: { onChange, onBlur, value } }) => (
						<TextInput
							placeholder={t("form.auth.password")}
							textContentType={
								formType === "login"
									? "password"
									: "newPassword"
							}
							onBlur={onBlur}
							onChangeText={onChange}
							value={value}
							autoComplete={
								formType === "login" ? "password" : undefined
							}
							error={errors.password?.message}
							secureTextEntry
						/>
					)}
				/>
				{formType === "signup" && (
					<Controller
						control={control}
						name="confirm"
						rules={{
							required: {
								value: true,
								message: t("form.auth.pleaseConfirm"),
							},
							minLength: {
								value: 6,
								message: t("form.auth.passwordTooShort"),
							},
							validate: (confirmValue, form) => {
								if (confirmValue !== form.password) {
									return t("form.auth.passwordsAreDifferent");
								}
							},
						}}
						render={({ field: { onChange, onBlur, value } }) => (
							<TextInput
								placeholder={t(
									"form.auth.confirmPasswordField",
								)}
								onBlur={onBlur}
								onChangeText={onChange}
								value={value}
								textContentType="newPassword"
								secureTextEntry
								error={errors.confirm?.message}
							/>
						)}
					/>
				)}
				<Button
					disabled={isLoading}
					onPress={handleSubmit(onSubmit)}
					title={t(
						formType === "login"
							? "auth.loginButton"
							: "auth.signupButton",
					)}
				/>
				{errorMsg && (
					<View style={styles.errorContainer}>
						<ErrorIcon style={styles.errorMsg} />
						<Text style={styles.errorMsg}>{errorMsg}</Text>
					</View>
				)}
				<Divider h withInsets />
				<Button
					variant="outlined"
					onPress={() => {
						setFormType(formType === "login" ? "signup" : "login");
					}}
					title={t(
						formType === "login" ? "auth.signup" : "auth.signin",
					)}
				/>
			</View>
		</ScrollView>
	);
}
