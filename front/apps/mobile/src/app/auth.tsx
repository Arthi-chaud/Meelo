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

import { useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import { Fragment, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { getCurrentUserStatus } from "@/api/queries";
import { AddIcon, MoreIcon } from "@/ui/icons";
import { getAPI_ } from "~/api";
import { InstanceButton } from "~/components/instance-button";
import { useLoginForm } from "~/components/login-form";
import { Banner } from "~/components/meelo";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { showErrorToast } from "~/primitives/toast";
import {
	currentInstanceAtom,
	deleteOtherInstanceAtom,
	type MeeloInstance,
	otherInstancesAtom,
} from "~/state/user";

const styles = StyleSheet.create((theme, rt) => ({
	root: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		marginBottom: theme.gap(10),
		justifyContent: "space-evenly",
		flex: 1,
	},
	banner: {
		height: 300,
		maxHeight: rt.screen.height / 4,
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "flex-end",
	},
	formContainer: {
		display: "flex",
		width: "100%",
		flexDirection: "column",
		justifyContent: "flex-start",
		alignItems: "center",
		gap: theme.gap(3),
	},
	instanceButtons: {
		flexDirection: "column",
		gap: theme.gap(1),
		width: "100%",
		justifyContent: "center",
		paddingHorizontal: theme.gap(3),
	},
}));

export default function AuthenticationScreen() {
	const safeAreaStyle = useSafeAreaInsets();
	const { t } = useTranslation();
	const router = useRouter();
	const otherInstances = useAtomValue(otherInstancesAtom);
	const setCurrentInstance = useSetAtom(currentInstanceAtom);
	const deleteOtherInstance = useSetAtom(deleteOtherInstanceAtom);
	const { openLoginForm } = useLoginForm({
		onLogin: async ({ instanceUrl, token }) => {
			const api = getAPI_(token, instanceUrl);
			const res = await getCurrentUserStatus().exec(api)();
			setCurrentInstance({
				url: instanceUrl,
				accessToken: token,
				username: res.name,
			});
			router.replace("/");
		},
	});
	const signInToOtherInstance = useCallback(
		(instance: MeeloInstance) => {
			const api = getAPI_(instance.accessToken, instance.url);

			getCurrentUserStatus()
				.exec(api)()
				.then(() => {
					setCurrentInstance(instance);
					deleteOtherInstance(instance);
					router.replace("/");
				})
				.catch((e) => {
					showErrorToast({
						text: `${t("toasts.auth.signinFailed")}: ${e.message ?? e.error ?? JSON.stringify(e)}`,
					});
				});
		},
		[setCurrentInstance, router],
	);
	const signInAction = useCallback(
		(instance: MeeloInstance) => {
			return {
				onPress: () => signInToOtherInstance(instance),
				icon: MoreIcon,
			};
		},
		[signInToOtherInstance],
	);
	return (
		<View style={[styles.root, safeAreaStyle]}>
			<Banner style={styles.banner} />
			{otherInstances.length ? (
				<View style={styles.instanceButtons}>
					{otherInstances.map((instance, idx) => (
						<Fragment key={idx}>
							<InstanceButton
								key={idx}
								instance={instance}
								enabled
								actions={[signInAction(instance)]}
							/>
							<Divider h />
						</Fragment>
					))}
				</View>
			) : null}
			<View style={styles.formContainer}>
				<Button
					title={t("actions.connectToNewServer")}
					icon={AddIcon}
					onPress={openLoginForm}
				/>
			</View>
			{!otherInstances.length ? <View /> : null}
			{/* to have a 1/3 page-height footer */}
		</View>
	);
}
