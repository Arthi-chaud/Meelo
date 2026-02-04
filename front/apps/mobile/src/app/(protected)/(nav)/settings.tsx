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

import { useNavigation } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import i18next from "i18next";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Fragment, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import {
	getCurrentUserStatus,
	getMatcherVersion,
	getScannerVersion,
	getSettings,
} from "@/api/queries";
import { emptyPlaylistAtom } from "@/state/player";
import {
	CheckIcon,
	DeleteIcon,
	ExpandMoreIcon,
	MinusIcon,
	MoreIcon,
	OpenExternalIcon,
	PlusIcon,
	UncheckIcon,
} from "@/ui/icons";
import { getAPI_, useQuery, useQueryClient } from "~/api";
import { SelectModalButton } from "~/components/bottom-modal-sheet/select";
import { InstanceButton } from "~/components/instance-button";
import { LoadableText } from "~/components/loadable_text";
import { useLoginForm } from "~/components/login-form";
import { SafeScrollView } from "~/components/safe-view";
import { SectionHeader } from "~/components/section-header";
import {
	downloadsAtom,
	maxCachedCountAtom,
	queuePrefetchCountAtom,
	useDownloadManager,
} from "~/downloads";
import { useColorScheme } from "~/hooks/color-scheme";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { showErrorToast, showSuccessToast } from "~/primitives/toast";
import { colorSchemePreference } from "~/state/color-scheme";
import { languagePreference } from "~/state/lang";
import {
	currentInstanceAtom,
	deleteOtherInstanceAtom,
	type MeeloInstance,
	otherInstancesAtom,
	popCurrentInstanceAtom,
} from "~/state/user";
import { Languages } from "../../../../../../translations";

const BuildCommit =
	process.env.EXPO_PUBLIC_BUILD_COMMIT ??
	(process.env.NODE_ENV === "development" ? "dev" : "unknown");

const useResetAllTabs = () => {
	const navigation = useNavigation();

	return useCallback(() => {
		const st = navigation.getState();
		if (!st) {
			return;
		}
		navigation.reset({
			...st,
			history: [],
			routes: st.routes.map((r) => ({
				...r,
				state: undefined,
			})),
		} as any);
	}, [navigation]);
};

export default function SettingsView() {
	const [queuePrefetchCount, setQueuePrefetchCount] = useAtom(
		queuePrefetchCountAtom,
	);
	const { downloadedFiles } = useAtomValue(downloadsAtom);
	const [maxCachedCount, setMaxCachedCount] = useAtom(maxCachedCountAtom);
	const { wipeCache } = useDownloadManager();
	const resetAllTabs = useResetAllTabs();
	const queryClient = useQueryClient();
	const { data: user } = useQuery(getCurrentUserStatus);
	const emptyPlaylist = useSetAtom(emptyPlaylistAtom);
	const otherInstances = useAtomValue(otherInstancesAtom);
	const [currentInstance, setCurrentInstance] = useAtom(currentInstanceAtom);
	const { t } = useTranslation();
	const popCurrentInstance = useSetAtom(popCurrentInstanceAtom);
	const deleteOtherInstance = useSetAtom(deleteOtherInstanceAtom);
	const insets = useSafeAreaInsets();
	const [colorSchemePref, setColorSchemePref] = useAtom(
		colorSchemePreference,
	);
	const onLeavingInstance = useCallback(() => {
		emptyPlaylist();
		queryClient.client.clear();
		resetAllTabs();
	}, [emptyPlaylist, queryClient, resetAllTabs]);
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
	const [lng, setLng] = useAtom(languagePreference);
	const { data: apiSettings } = useQuery(getSettings);
	const { data: scannerVersion } = useQuery(getScannerVersion);
	const { data: matcherVersion } = useQuery(getMatcherVersion);
	const actualColorScheme = useColorScheme();
	const onOtherInstanceSelect = useCallback(
		(instance: MeeloInstance) => {
			onLeavingInstance();
			popCurrentInstance();
			deleteOtherInstance(instance);
			setCurrentInstance(instance);
		},
		[onLeavingInstance, popCurrentInstanceAtom, setCurrentInstance],
	);
	return (
		<SafeScrollView style={[styles.root, { paddingTop: insets.top }]}>
			<View style={styles.header}>
				<Text content={t("nav.settings")} variant="h2" />
			</View>
			<Divider h />
			<View style={styles.section}>
				<SectionHeader
					style={styles.sectionHeader}
					content={t("settings.interface")}
					skeletonWidth={0}
				/>
				<View style={styles.sectionRow}>
					<Text
						content={t("settings.ui.useSystemTheme")}
						variant="h5"
					/>
					<Pressable
						onPress={() => {
							if (colorSchemePref === "system") {
								setColorSchemePref(actualColorScheme);
							} else {
								setColorSchemePref("system");
							}
						}}
					>
						<Icon
							variant={
								colorSchemePref === "system"
									? "Bold"
									: "Outline"
							}
							icon={
								colorSchemePref === "system"
									? CheckIcon
									: UncheckIcon
							}
						/>
					</Pressable>
				</View>

				<View style={styles.sectionRow}>
					<Text
						content={t("settings.ui.useDarkTheme")}
						variant="h5"
					/>
					<Pressable
						disabled={colorSchemePref === "system"}
						onPress={() => {
							setColorSchemePref(
								colorSchemePref === "dark" ? "light" : "dark",
							);
						}}
					>
						<Icon
							style={
								colorSchemePref === "system"
									? styles.disabledCheckButton
									: undefined
							}
							icon={
								actualColorScheme === "dark"
									? CheckIcon
									: UncheckIcon
							}
						/>
					</Pressable>
				</View>

				<View style={styles.sectionRow}>
					<Text content={t("settings.ui.language")} variant="h5" />
					<SelectModalButton
						header={t("settings.ui.language")}
						closeOnSelect
						values={Languages}
						isSelected={(item) => lng === item}
						buttonProps={{
							title: t(
								`settings.ui.lang.${i18next.language as "en"}`,
							),
							width: "fitContent",
							icon: ExpandMoreIcon,
							iconPosition: "right",
							size: "small",
						}}
						onSelect={(selected) => {
							setLng(selected);
						}}
						formatItem={(item) =>
							t(`settings.ui.lang.${item}`, {
								lng: item,
							})
						}
					/>
				</View>
			</View>

			<Divider h />
			<View style={styles.section}>
				<SectionHeader
					style={styles.sectionHeader}
					content={t("settings.cache.header")}
					skeletonWidth={0}
				/>

				<View style={styles.sectionRow}>
					<Text
						content={t("settings.cache.maxCachedTracks")}
						variant="h5"
					/>
					<View style={styles.subrow}>
						<Button
							icon={MinusIcon}
							size="small"
							disabled={maxCachedCount === 20}
							onPress={() =>
								setMaxCachedCount(
									Math.max(20, maxCachedCount - 5),
								)
							}
						/>
						<Text
							content={maxCachedCount.toString()}
							variant="h5"
							color="secondary"
						/>
						<Button
							icon={PlusIcon}
							size="small"
							disabled={maxCachedCount === 100}
							onPress={() =>
								setMaxCachedCount(
									Math.min(100, maxCachedCount + 5),
								)
							}
						/>
					</View>
				</View>

				<View style={styles.sectionRow}>
					<Text
						content={t("settings.cache.prefetchCount")}
						variant="h5"
					/>
					<View style={styles.subrow}>
						<Button
							icon={MinusIcon}
							size="small"
							disabled={queuePrefetchCount === 0}
							onPress={() =>
								setQueuePrefetchCount(
									Math.max(0, queuePrefetchCount - 1),
								)
							}
						/>
						<Text
							content={queuePrefetchCount.toString()}
							variant="h5"
							color="secondary"
						/>
						<Button
							icon={PlusIcon}
							size="small"
							disabled={queuePrefetchCount === 15}
							onPress={() =>
								setQueuePrefetchCount(
									Math.min(15, queuePrefetchCount + 1),
								)
							}
						/>
					</View>
				</View>

				<View style={styles.sectionRow}>
					<View style={styles.subrow}>
						<Text
							content={t("settings.cache.clearCache")}
							variant="h5"
						/>
						<Text
							content={`(${downloadedFiles.length.toString()} ${t("models.track_plural")})`}
							variant="h5"
							color="secondary"
						/>
					</View>

					<Button
						icon={DeleteIcon}
						size="small"
						onPress={() => {
							const err = wipeCache();
							if (err) {
								// biome-ignore lint/suspicious/noConsole: For debug
								console.error(err.message ?? err.toString());
								showErrorToast({
									text: t("toasts.clearCache.error"),
								});
							}
							showSuccessToast({
								text: t("toasts.clearCache.success"),
							});
						}}
					/>
				</View>
			</View>

			{user?.admin && (
				<>
					<Divider h />
					<View style={styles.section}>
						<SectionHeader
							style={styles.sectionHeader}
							content={t("settings.users.admin")}
							skeletonWidth={0}
						/>
						<Button
							title={t("settings.manageFromWebApp")}
							onPress={() =>
								openBrowserAsync(
									queryClient.api.urls.api.replace(
										"/api",
										"/settings",
									),
								)
							}
							width="fill"
							icon={OpenExternalIcon}
							iconPosition="right"
							containerStyle={{ justifyContent: "center" }}
						/>
					</View>
				</>
			)}
			<Divider h />

			{otherInstances.length > 0 && (
				<View style={styles.section}>
					<SectionHeader
						style={styles.sectionHeader}
						content={t("actions.switchServer")}
						skeletonWidth={0}
					/>

					{currentInstance && (
						<>
							<View style={styles.instanceButtonContainer}>
								<InstanceButton
									enabled={false}
									instance={currentInstance}
									trailing="(Current)"
								/>
							</View>
							<Divider h withInsets />
						</>
					)}
					{otherInstances.map((instance, idx) => (
						<Fragment key={idx}>
							<View style={styles.instanceButtonContainer}>
								<InstanceButton
									enabled
									instance={instance}
									actions={[
										{
											icon: DeleteIcon,
											onPress: () =>
												deleteOtherInstance(instance),
										},
										{
											icon: MoreIcon,
											onPress: () =>
												onOtherInstanceSelect(instance),
										},
									]}
								/>
							</View>
							<Divider h withInsets />
						</Fragment>
					))}
				</View>
			)}
			<View style={styles.section}>
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
			</View>
			<Divider h />
			<View style={[styles.footer, styles.section]}>
				<Text
					style={styles.versionNumber}
					content={`Build: ${BuildCommit}`}
				/>
				{(
					[
						["API", apiSettings],
						["Scanner", scannerVersion],
						["Matcher", matcherVersion],
					] as const
				).map(([serviceName, versionQuery]) => (
					<LoadableText
						key={serviceName}
						style={styles.versionNumber}
						content={
							apiSettings
								? `${serviceName} version: ${versionQuery ? (versionQuery.version ?? "Unknown") : "Loading"}`
								: undefined
						}
						skeletonWidth={15}
					/>
				))}
			</View>
		</SafeScrollView>
	);
}

const styles = StyleSheet.create((theme) => ({
	root: { paddingHorizontal: theme.gap(1) },
	header: { paddingHorizontal: theme.gap(1), paddingVertical: theme.gap(2) },
	section: {
		paddingVertical: theme.gap(1),
		gap: theme.gap(1),
	},
	sectionHeader: { marginLeft: -theme.gap(1) },
	sectionRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		width: "100%",
		paddingBottom: theme.gap(0.5),
		paddingHorizontal: theme.gap(1),
	},
	disabledCheckButton: { color: theme.colors.text.secondary },
	logoutButtonStyle: { flex: 1 },
	footer: {
		color: theme.colors.text.secondary,
		width: "100%",
		alignItems: "center",
		gap: theme.gap(2),
	},
	versionNumber: { color: theme.colors.text.secondary },
	instanceButtonContainer: { paddingHorizontal: theme.gap(1) },
	subrow: { flexDirection: "row", gap: theme.gap(1) },
}));
