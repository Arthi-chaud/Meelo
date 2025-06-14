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

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { MeeloBanner } from "~/components/meelo_banner";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { TextInput } from "~/primitives/text_input";

const styles = StyleSheet.create((theme) => ({
	root: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		flex: 1,
		paddingVertical: theme.gap(8),
		justifyContent: "space-evenly",
	},
	banner: {
		flex: 1,
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "flex-end",
	},
	formContainer: {
		flex: 2,
		display: "flex",
		width: "100%",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		gap: theme.gap(3),
	},
}));

//TODO Handle empty fields
//TODO On press, push to API
//TODO On authed, update atom

export default function AuthenticationScreen() {
	const { t } = useTranslation();
	const [formType, setFormType] = useState<"login" | "signup">("login");
	return (
		<View style={styles.root}>
			<MeeloBanner style={styles.banner} />
			<View style={styles.formContainer}>
				<TextInput placeholder={t("form.auth.username")} />
				<TextInput placeholder={t("form.auth.password")} />
				{formType === "signup" && (
					<TextInput
						placeholder={t("form.auth.confirmPasswordField")}
					/>
				)}
				<Button
					onPress={() => {}}
					title={t(
						formType === "login"
							? "auth.loginButton"
							: "auth.signupButton",
					)}
				/>
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
		</View>
	);
}
