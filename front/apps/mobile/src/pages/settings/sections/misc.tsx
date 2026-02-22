import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import { getCurrentUserStatus } from "@/api/queries";
import { getAPI_ } from "~/api";
import { useLoginForm } from "~/components/login-form";
import { Button } from "~/primitives/button";
import { showSuccessToast } from "~/primitives/toast";
import { currentInstanceAtom, popCurrentInstanceAtom } from "~/state/user";
import { Section } from "../components";
import { useOnLeavingInstance } from "../hooks";

export const MiscSection = () => {
	const { t } = useTranslation();
	const popCurrentInstance = useSetAtom(popCurrentInstanceAtom);
	const onLeavingInstance = useOnLeavingInstance();
	const setCurrentInstance = useSetAtom(currentInstanceAtom);

	const { openLoginForm } = useLoginForm({
		onLogin: async (data) => {
			const api = getAPI_(data.token, data.instanceUrl);
			const res = await getCurrentUserStatus().exec(api)();
			onLeavingInstance();
			popCurrentInstance();
			setCurrentInstance({
				url: data.instanceUrl,
				accessToken: data.token,
				username: res.name,
			});
			showSuccessToast({ text: t("toasts.auth.serverSwitchSuccessful") });
		},
	});

	return (
		<Section>
			<Button
				title={t("actions.connectToNewServer")}
				containerStyle={{ alignItems: "center" }}
				labelStyle={styles.logoutButtonStyle}
				onPress={openLoginForm}
				width="fill"
			/>
			<Button
				title={t("actions.logout")}
				width="fill"
				containerStyle={{ alignItems: "center" }}
				labelStyle={styles.logoutButtonStyle}
				onPress={() => {
					onLeavingInstance();
					popCurrentInstance();
				}}
			/>
		</Section>
	);
};

const styles = StyleSheet.create(() => ({
	logoutButtonStyle: { flex: 1 },
}));
