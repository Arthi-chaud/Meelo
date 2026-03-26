import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import { getCurrentUserStatus } from "@/api/queries";
import { AddIcon, LogoutIcon } from "@/ui/icons";
import { getAPI_, useQueryClient } from "~/api";
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
	const queryClient = useQueryClient();
	const clearCache = useCallback(() => {
		queryClient.client.invalidateQueries();
	}, [queryClient]);

	return (
		<Section>
			<Button
				title={t("actions.connectToNewServer")}
				icon={AddIcon}
				containerStyle={styles.buttonStyle}
				onPress={openLoginForm}
				width="fill"
			/>
			<Button
				title={t("actions.clearQueryCache")}
				containerStyle={styles.buttonStyle}
				onPress={clearCache}
				width="fill"
			/>
			<Button
				title={t("actions.logout")}
				icon={LogoutIcon}
				width="fill"
				containerStyle={styles.buttonStyle}
				onPress={() => {
					onLeavingInstance();
					popCurrentInstance();
				}}
			/>
		</Section>
	);
};

const styles = StyleSheet.create(() => ({
	buttonStyle: { alignItems: "center" },
}));
