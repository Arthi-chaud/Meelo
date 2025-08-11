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

import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import {
	KeyboardAwareScrollView,
	KeyboardToolbar,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { Toast } from "toastify-react-native";
import { getSettings } from "@/api/queries";
import { toTanStackQuery } from "@/api/query";
import type { Settings } from "@/models/settings";
import { ErrorIcon } from "@/ui/icons";
import { getAPI_ } from "~/api";
import { Banner } from "~/components/meelo";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { Text } from "~/primitives/text";
import { TextInput } from "~/primitives/text_input";
import { accessTokenAtom, instanceUrlAtom } from "~/state/user";

const styles = StyleSheet.create((theme, rt) => ({
	root: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		marginBottom: theme.gap(10),
		justifyContent: "space-evenly",
	},
	// The padding is a bit much, but it allows making the next form field visible
	// It would be nice to just center the focused field when the keyboard is up
	keyboard: { paddingTop: theme.gap(20) },
	banner: {
		height: 300,
		maxHeight: rt.screen.height / 4,
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

function timeout(ms: number) {
	return new Promise<any>((_, reject) => {
		setTimeout(() => reject(new Error("Request timed out")), ms);
	});
}

export default function AuthenticationScreen() {
	const { t } = useTranslation();
	const defaultValues = {
		url: "https://",
		username: "",
		password: "",
		confirm: "",
	};
	const setAccessToken = useSetAtom(accessTokenAtom);
	const setInstanceUrl = useSetAtom(instanceUrlAtom);
	const [isLoading, setLoading] = useState(false);
	const [errorMsg, setErrorMessage] = useState<string>();
	const queryClient = useQueryClient();
	const [formType, setFormType] = useState<"url" | "login" | "signup">("url");
	const [allowSignup, setAllowSignup] = useState(false);
	const safeAreaStyle = useSafeAreaInsets();
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm({ defaultValues });
	const onSubmit = (data: typeof defaultValues) => {
		const instanceUrl = data.url.replace(/\/$/, "");
		const api = getAPI_(null, instanceUrl);
		setLoading(true);
		setErrorMessage(undefined);
		if (formType === "url") {
			Promise.race([
				timeout(3000),
				queryClient.fetchQuery(
					toTanStackQuery(api, () => getSettings()),
				),
			])
				.then(({ enableUserRegistration }: Settings) => {
					setAllowSignup(enableUserRegistration);
					setFormType("login");
				})
				.catch((e) => {
					setErrorMessage(e.message ?? e.toString());
				})
				.finally(() => {
					setLoading(false);
				});
		} else if (formType === "signup") {
			Promise.race([
				timeout(3000),
				api.register({
					username: data.username,
					password: data.password,
				}),
			])
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
			Promise.race([
				timeout(3000),
				api.login({
					username: data.username,
					password: data.password,
				}),
			])
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
		<>
			<KeyboardAwareScrollView
				bottomOffset={styles.keyboard.paddingTop}
				contentContainerStyle={[styles.root, safeAreaStyle]}
			>
				<Banner style={styles.banner} />
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
								autoCorrect={false}
								autoCapitalize="none"
								onBlur={onBlur}
								onChangeText={(e) => {
									if (formType !== "url") {
										setFormType("url");
									}
									onChange(e);
								}}
								error={errors.url?.message}
								value={value}
							/>
						)}
					/>

					{formType !== "url" && (
						<>
							<Controller
								control={control}
								name="username"
								rules={{
									required: {
										value: true,
										message: t(
											"form.auth.usernameTooShort",
										),
									},
									minLength: {
										value: 4,
										message: t(
											"form.auth.usernameTooShort",
										),
									},
								}}
								render={({
									field: { onChange, onBlur, value },
								}) => (
									<TextInput
										placeholder={t("form.auth.username")}
										textContentType="username"
										autoCorrect={false}
										autoCapitalize="none"
										onBlur={onBlur}
										onChangeText={onChange}
										value={value}
										autoComplete={
											formType === "login"
												? "username"
												: undefined
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
										message: t(
											"form.auth.passwordIsRequired",
										),
									},
									minLength: {
										value: 6,
										message: t(
											"form.auth.passwordTooShort",
										),
									},
								}}
								render={({
									field: { onChange, onBlur, value },
								}) => (
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
											formType === "login"
												? "password"
												: undefined
										}
										error={errors.password?.message}
										secureTextEntry
									/>
								)}
							/>
						</>
					)}
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
										return t(
											"form.auth.passwordsAreDifferent",
										);
									}
								},
							}}
							render={({
								field: { onChange, onBlur, value },
							}) => (
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
							formType === "url"
								? "auth.connectButton"
								: formType === "login"
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
					{allowSignup && formType !== "url" && (
						<>
							<Divider h withInsets />
							<Button
								variant="outlined"
								onPress={() => {
									setFormType(
										formType === "login"
											? "signup"
											: "login",
									);
									setErrorMessage(undefined);
								}}
								title={t(
									formType === "login"
										? "auth.signup"
										: "auth.signin",
								)}
							/>
						</>
					)}
				</View>
			</KeyboardAwareScrollView>
			<KeyboardToolbar />
		</>
	);
}
