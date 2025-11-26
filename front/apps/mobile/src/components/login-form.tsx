import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { openBrowserAsync } from "expo-web-browser";
import { useCallback, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { getSettings } from "@/api/queries";
import type { Settings } from "@/models/settings";
import { ErrorIcon, OpenExternalIcon } from "@/ui/icons";
import { getAPI_ } from "~/api";
import { useModal } from "~/components/bottom-modal-sheet";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { Text } from "~/primitives/text";
import { TextInput } from "~/primitives/text_input";

type LoginFormProps = {
	onLogin: (data: { instanceUrl: string; token: string }) => Promise<void>;
};

//TODO Risk of overflow when in horizontal mode on tablet

export const useLoginForm = (props: LoginFormProps) => {
	const content = useCallback(() => {
		return <LoginForm {...props} />;
	}, [props]);
	const { openModal } = useModal({
		content,
		onDismiss: () => {},
	});
	return { openLoginForm: openModal };
};

export const LoginForm = ({ onLogin }: LoginFormProps) => {
	const { t } = useTranslation();
	const defaultValues = {
		url: "https://",
		username: "",
		password: "",
		confirm: "",
	};
	const { dismiss } = useBottomSheetModal();
	const [isLoading, setLoading] = useState(false);
	const [errorMsg, setErrorMessage] = useState<string>();
	const [formType, setFormType] = useState<"url" | "login">("url");
	const [allowSignup, setAllowSignup] = useState(false);
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm({ defaultValues });
	const instanceUrl = useWatch({ control, name: "url" });
	const onSubmit = (data: typeof defaultValues) => {
		const instanceUrl = data.url.replace(/\/$/, "");
		const api = getAPI_(null, instanceUrl);
		setLoading(true);
		setErrorMessage(undefined);
		if (formType === "url") {
			//Note: we dont want/need to cache the settings
			//It would prank when the instance url changes
			Promise.race([timeout(5000), getSettings().exec(api)()])
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
		} else {
			Promise.race([
				timeout(5000),
				api.login({
					username: data.username,
					password: data.password,
				}),
			])
				.then(async ({ access_token }) => {
					Keyboard.dismiss();
					await onLogin({ instanceUrl, token: access_token });
					setLoading(false);
					dismiss();
				})
				.catch((e) => {
					setLoading(false);
					setErrorMessage(e.message ?? e.toString());
				});
		}
	};
	return (
		<View style={styles.root}>
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
						inModal
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
								message: t("form.auth.usernameTooShort"),
							},
							minLength: {
								value: 4,
								message: t("form.auth.usernameTooShort"),
							},
						}}
						render={({ field: { onChange, onBlur, value } }) => (
							<TextInput
								inModal
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
								message: t("form.auth.passwordIsRequired"),
							},
							minLength: {
								value: 6,
								message: t("form.auth.passwordTooShort"),
							},
						}}
						render={({ field: { onChange, onBlur, value } }) => (
							<TextInput
								inModal
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
			<View style={styles.submitButton}>
				<Button
					disabled={isLoading}
					onPress={handleSubmit(onSubmit)}
					width="fitContent"
					title={t(
						formType === "url"
							? "auth.connectButton"
							: formType === "login"
								? "auth.loginButton"
								: "auth.signupButton",
					)}
				/>
			</View>
			{errorMsg && (
				<View style={styles.errorContainer}>
					<ErrorIcon style={styles.errorMsg} />
					<Text style={styles.errorMsg}>{errorMsg}</Text>
				</View>
			)}
			{allowSignup && formType !== "url" && (
				<>
					<Divider h />
					<View style={styles.signupButton}>
						<Button
							size="small"
							variant="outlined"
							title={t("auth.signup")}
							icon={OpenExternalIcon}
							iconPosition="right"
							onPress={() => openBrowserAsync(instanceUrl)}
						/>
					</View>
				</>
			)}
		</View>
	);
};

function timeout(ms: number) {
	return new Promise<any>((_, reject) => {
		setTimeout(() => reject(new Error("Request timed out")), ms);
	});
}

const styles = StyleSheet.create((theme) => ({
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
	signupText: { textDecorationLine: "underline" },
	submitButton: { paddingVertical: theme.gap(2) },
	signupButton: { paddingTop: theme.gap(2) },
	root: {
		display: "flex",
		width: "100%",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		gap: theme.gap(1),
		paddingBottom: theme.gap(2),
	},
}));
