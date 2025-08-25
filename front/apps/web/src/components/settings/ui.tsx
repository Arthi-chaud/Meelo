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

import {
	Box,
	Button,
	Checkbox,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	MenuItem,
	NoSsr,
	Select,
	Skeleton,
	Slider,
	Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useMutation } from "@tanstack/react-query";
import { HookTextField, useHookForm } from "mui-react-hook-form-plus";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useCallback, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "usehooks-ts";
import {
	getScannerVersion,
	getScrobblerStatus,
	getSettings,
} from "@/api/queries";
import { type Scrobbler, Scrobblers } from "@/models/scrobblers";
import {
	BookIcon,
	DeleteIcon,
	MovingStarIcon,
	OpenExternalIcon,
	WarningIcon,
} from "@/ui/icons";
import { useAPI, useQuery, useQueryClient } from "~/api";
import SectionHeader from "~/components/section-header";
import { type Language, Languages, persistLanguage } from "~/i18n";
import { useModal } from "../modal";

const SettingGroupStyle = {
	paddingTop: 1,
	paddingBottom: 2,
	rowSpacing: 4,
	alignItems: "center",
	display: "flex",
} as const;

const InputContainerStyle = {
	justifyContent: "flex-end",
	display: "flex",
} as const;

const RepositoryUrl = "https://github.com/Arthi-chaud/meelo";
const LinkIconStyle = { marginBottom: -5, marginRight: 5 };

const AppVersion = process.env.NEXT_PUBLIC_VERSION || "unknown";

const UISettings = () => {
	const { t, i18n } = useTranslation();
	const apiSettings = useQuery(() => getSettings());
	const scannerVersion = useQuery(() => getScannerVersion());
	const colorScheme = useColorScheme();
	const [prefersNotifs, setPrefersNotif] = useLocalStorage(
		"allow_notifs",
		false,
	);

	const [crossfade, setCrossfade] = useLocalStorage("crossfade", 1.5);
	const notificationsAPIAvailable = typeof Notification !== "undefined";
	const [notificationsEnabled, setNotificationsEnabled] = useState(
		() =>
			notificationsAPIAvailable && Notification.permission === "granted",
	);
	return (
		<NoSsr>
			<SectionHeader heading={t("settings.ui.playback")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid size={{ xs: 10 }}>{t("settings.ui.crossfade")}</Grid>
				<Grid sx={InputContainerStyle} size={{ xs: 2 }}>
					<Slider
						step={0.5}
						min={0}
						defaultValue={crossfade}
						onChangeCommitted={(_, n) => {
							setCrossfade(n);
						}}
						valueLabelFormat={(n) => `${n}s`}
						max={12}
						valueLabelDisplay="auto"
					/>
				</Grid>
			</Grid>
			<SectionHeader heading={t("settings.ui.colorScheme")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid size={{ xs: 11 }}>{t("settings.ui.useSystemTheme")}</Grid>
				<Grid sx={InputContainerStyle} size={{ xs: 1 }}>
					<Checkbox
						onChange={(_, isChecked) =>
							colorScheme.setMode(
								isChecked
									? "system"
									: (colorScheme.systemMode ?? "light"),
							)
						}
						checked={colorScheme.mode === "system"}
					/>
				</Grid>
				<Grid size={{ xs: 11 }}>{t("settings.ui.useDarkTheme")}</Grid>
				<Grid sx={InputContainerStyle} size={{ xs: 1 }}>
					<Checkbox
						onChange={(_, isChecked) =>
							colorScheme.setMode(isChecked ? "dark" : "light")
						}
						disabled={colorScheme.mode === "system"}
						checked={
							colorScheme.mode === "dark" ||
							colorScheme.systemMode === "dark"
						}
					/>
				</Grid>
			</Grid>
			<SectionHeader heading={t("settings.ui.language")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid size={{ xs: 10 }}>{t("settings.ui.language")}</Grid>
				<Grid sx={InputContainerStyle} size={{ xs: 2 }}>
					<Select
						size="small"
						value={i18n.language}
						onChange={(event) => {
							i18n.changeLanguage(event.target.value);
							persistLanguage(event.target.value as Language);
						}}
					>
						{Languages.map((language, languageIndex) => (
							<MenuItem
								key={languageIndex}
								value={language}
								style={{ borderRadius: 0 }}
							>
								{t(`settings.ui.lang.${language}`, {
									lng: language,
								})}
							</MenuItem>
						))}
					</Select>
				</Grid>
			</Grid>
			<SectionHeader heading={t("settings.ui.notifications")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid size={{ xs: 10 }}>{t("settings.ui.permissions")}</Grid>
				<Grid sx={InputContainerStyle} size={{ xs: 2 }}>
					<Button
						variant="contained"
						onClick={() => {
							if (!notificationsAPIAvailable) {
								return;
							}
							if (notificationsEnabled) {
								new Notification("Meelo says hello!", {
									body: "👋",
									silent: true,
								});
							} else {
								Notification.requestPermission().then(
									(value) =>
										value === "granted" &&
										setNotificationsEnabled(true),
								);
							}
						}}
						disabled={!notificationsAPIAvailable}
					>
						{!notificationsAPIAvailable
							? "unavailable"
							: notificationsEnabled
								? "test"
								: "ask"}
					</Button>
				</Grid>
				<Grid size={{ xs: 10 }}>
					{t("settings.ui.notifyOnTrackChange")}
				</Grid>
				<Grid sx={InputContainerStyle} size={{ xs: 2 }}>
					<Checkbox
						onChange={(_, isChecked) => {
							setPrefersNotif(isChecked);
						}}
						checked={prefersNotifs === true}
					/>
				</Grid>
			</Grid>
			<SectionHeader heading={t("settings.ui.scrobblers.header")} />
			<ScrobblersSection />
			<SectionHeader heading={t("settings.ui.keyboardBindings")} />
			<Grid container sx={SettingGroupStyle}>
				<Grid size={{ xs: 12 }}>
					{t(
						"settings.ui.openKeyboarBindingsModalByTypingQuestionMark",
					)}
				</Grid>
			</Grid>

			<SectionHeader heading={t("settings.ui.account.header")} />
			<AccountSection />
			<SectionHeader heading={t("settings.ui.project")} />
			<p>
				<MovingStarIcon style={LinkIconStyle} />
				{t("settings.ui.external.enjoyingTheProject")}{" "}
				<Link
					style={{ textDecoration: "underline" }}
					href={RepositoryUrl}
				>
					{t("settings.ui.external.starOnGithub")}
				</Link>
			</p>
			<p>
				<WarningIcon style={LinkIconStyle} />
				{t("settings.ui.external.encounteredABug")}{" "}
				<Link
					style={{ textDecoration: "underline" }}
					href={`${RepositoryUrl}/issues`}
				>
					{t("settings.ui.external.openAnIssue")}
				</Link>
			</p>
			<p>
				<BookIcon style={LinkIconStyle} />
				<Link
					style={{ textDecoration: "underline" }}
					href="https://github.com/Arthi-chaud/Meelo/wiki"
				>
					{t("settings.ui.external.readTheDoc")}
				</Link>
			</p>

			<SectionHeader heading={t("settings.ui.versions")} />

			<Grid container sx={{ ...SettingGroupStyle, rowGap: 2 }}>
				{[
					["Web App", AppVersion] as const,
					["Server", apiSettings.data?.version] as const,
					["Scanner", scannerVersion.data?.version] as const,
				].map(([appName, version]) => (
					<Fragment key={appName}>
						<Grid size={{ xs: 11 }}>{appName}</Grid>
						<Grid sx={InputContainerStyle} size={{ xs: 1 }}>
							{version ?? <Skeleton />}
						</Grid>
					</Fragment>
				))}
			</Grid>
		</NoSsr>
	);
};

type ChangePasswordForm = Record<
	"oldPassword" | "newPassword" | "confirm",
	string
>;
const AccountSection = () => {
	const { t } = useTranslation();
	const [openModal, closeModal] = useModal();
	const api = useAPI();
	const onSubmit = useCallback(
		({ oldPassword, newPassword }: ChangePasswordForm) => {
			api.changePassword({
				oldPassword,
				newPassword,
			})
				.then(() => toast.success("Update successful"))
				.catch((e) => toast.error(e.message ?? e.toString()));
		},
		[t, api],
	);
	return (
		<Grid
			container
			sx={{ ...SettingGroupStyle, justifyContent: "space-between" }}
		>
			<Grid>{t("settings.ui.account.changePassword")}</Grid>
			<Grid sx={InputContainerStyle}>
				<Button
					variant="contained"
					onClick={() =>
						openModal(() => (
							<ChangePasswordModal
								close={closeModal}
								onSubmit={onSubmit}
							/>
						))
					}
				>
					{t("settings.ui.account.changePassword")}
				</Button>
			</Grid>
		</Grid>
	);
};

const ChangePasswordModal = ({
	close,
	onSubmit,
}: {
	close: () => void;
	onSubmit: (f: ChangePasswordForm) => void;
}) => {
	const defaultValues: ChangePasswordForm = {
		oldPassword: "",
		newPassword: "",
		confirm: "",
	};
	const { registerState, handleSubmit, control } = useHookForm({
		defaultValues,
	});
	const newPassword = useWatch({ control, name: "newPassword" });
	const { t } = useTranslation();
	const onSubmit_ = (values: typeof defaultValues) => {
		onSubmit(values);
		close();
	};

	return (
		<>
			<DialogTitle>{t("settings.ui.account.changePassword")}</DialogTitle>
			<form
				onSubmit={handleSubmit(onSubmit_)}
				style={{ width: "100%", height: "100%" }}
			>
				<DialogContent>
					<HookTextField
						{...registerState("oldPassword")}
						textFieldProps={{
							autoFocus: true,
							hidden: true,
							type: "password",
							fullWidth: true,
							label: "Enter your current password",
						}}
						rules={{
							required: true,
						}}
					/>
					<Grid container sx={{ paddingTop: 2 }}>
						<HookTextField
							{...registerState("newPassword")}
							textFieldProps={{
								type: "password",
								fullWidth: true,
								label: "Enter name your new password",
							}}
							rules={{
								required: true,
							}}
						/>
					</Grid>

					<Grid container sx={{ paddingTop: 2 }}>
						<HookTextField
							{...registerState("confirm")}
							textFieldProps={{
								type: "password",
								fullWidth: true,
								label: "Confirm new password",
							}}
							rules={{
								required: true,

								validate: (confirmValue) => {
									if (confirmValue !== newPassword) {
										return t(
											"form.auth.passwordsAreDifferent",
										);
									}
								},
							}}
						/>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={close}>{t("form.cancel")}</Button>
					<Button type="submit" color="primary" variant="contained">
						{t("actions.update")}
					</Button>
				</DialogActions>
			</form>
		</>
	);
};

const ScrobblersSection = () => {
	const scrobblers = useQuery(() => getScrobblerStatus());
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [openModal, closeModal] = useModal();
	const api = queryClient.api;
	const displayScrobbler = useCallback(
		(scrobbler: Scrobbler) => {
			if (!scrobblers.data) {
				return false;
			}
			return (
				scrobblers.data.connected.includes(scrobbler) ||
				scrobblers.data.available.includes(scrobbler)
			);
		},
		[scrobblers.data],
	);
	const anyScrobblersIsEnabled = useMemo(
		() =>
			scrobblers.data &&
			(scrobblers.data.available.length > 0 ||
				scrobblers.data.connected.length > 0),
		[scrobblers.data],
	);

	const deletionMutation = useMutation({
		mutationFn: async (scrobbler: Scrobbler) => {
			return toast
				.promise(api.disconnectScrobbler(scrobbler), {
					success: t("toasts.scrobblers.unlinkingSuccessful"),
					loading: t("toasts.scrobblers.unlinking"),
					error: t("toasts.scrobblers.unlinkingFailed"),
				})
				.then(() => {
					queryClient.client.invalidateQueries({
						queryKey: ["scrobblers"],
					});
				});
		},
	});
	const router = useRouter();

	return (
		<Box
			sx={{
				...SettingGroupStyle,
				justifyContent: "space-between",
				alignItems: "center",
				display: "flex",
			}}
		>
			<Typography>
				{t("settings.ui.scrobblers.connect_scrobblers")}
			</Typography>

			<Grid container columnSpacing={2}>
				{scrobblers.data === undefined ? (
					<Button variant="outlined">
						<Skeleton width={"50px"} />
					</Button>
				) : anyScrobblersIsEnabled ? (
					// biome-ignore lint/complexity/noUselessFragments: false positive?
					<>
						{Scrobblers.map(
							(scrobbler) =>
								displayScrobbler(scrobbler) && (
									<Button
										color={
											scrobblers.data.connected.includes(
												scrobbler,
											)
												? "error"
												: undefined
										}
										variant="outlined"
										onClick={async () => {
											const isEnabled =
												scrobblers.data.connected.includes(
													scrobbler,
												);
											if (isEnabled) {
												deletionMutation.mutate(
													scrobbler,
												);
												return;
											}
											switch (scrobbler) {
												case "ListenBrainz":
													openModal(() => (
														<ListenBrainzTokenModal
															close={closeModal}
														/>
													));
													break;
												case "LastFM":
													router.push(
														(
															await api.getLastFMAuthUrl(
																window.location
																	.origin,
															)
														).url,
													);
													break;
											}
										}}
										{...(scrobblers.data.connected.includes(
											scrobbler,
										)
											? {
													startIcon: (
														<DeleteIcon
															size={"1em"}
														/>
													),
												}
											: {
													endIcon: (
														<OpenExternalIcon
															size={"1em"}
														/>
													),
												})}
									>
										{scrobbler}
									</Button>
								),
						)}
					</>
				) : (
					<Typography
						sx={{ fontStyle: "italic", color: "text.disabled" }}
					>
						{t("settings.ui.scrobblers.no_scrobblers_enabled")}
					</Typography>
				)}
			</Grid>
		</Box>
	);
};

const ListenBrainzTokenModal = ({
	close: closeModal,
}: {
	close: () => void;
}) => {
	const api = useAPI();
	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const listenBrainzMutation = useMutation({
		mutationFn: async (dto: typeof defaultValues) => {
			return toast
				.promise(
					api.postListenBrainzToken(
						dto.token,
						dto.instanceUrl || null,
					),
					{
						success: t("toasts.scrobblers.linkingSuccessful"),
						loading: t("toasts.scrobblers.linking"),
						error: t("toasts.scrobblers.linkingListenBrainzFailed"),
					},
				)
				.then(() => {
					queryClient.client.invalidateQueries({
						queryKey: ["scrobblers"],
					});
				});
		},
	});
	const defaultValues = { token: "", instanceUrl: "" as string | null };
	const { registerState, handleSubmit } = useHookForm({
		defaultValues,
	});
	const onSubmit = (values: typeof defaultValues) => {
		listenBrainzMutation.mutate(values);
		closeModal();
	};
	return (
		<>
			<DialogTitle>ListenBrainz</DialogTitle>
			<form
				onSubmit={handleSubmit(onSubmit)}
				style={{ width: "100%", height: "100%" }}
			>
				<DialogContent>
					<HookTextField
						{...registerState("token")}
						textFieldProps={{
							autoFocus: true,
							fullWidth: true,
							label: t("form.scrobblers.listenbrainz.tokenLabel"),
							helperText: t(
								"form.scrobblers.listenbrainz.tokenHelperText",
							),
						}}
						gridProps={{}}
						rules={{
							required: {
								value: true,
								message: t(
									"form.scrobblers.listenbrainz.tokenIsRequired",
								),
							},
						}}
					/>

					<HookTextField
						{...registerState("instanceUrl")}
						textFieldProps={{
							fullWidth: true,
							label: t(
								"form.scrobblers.listenbrainz.instanceUrlLabel",
							),
							helperText: t(
								"form.scrobblers.listenbrainz.instanceUrlHelperText",
							),
						}}
						rules={{}}
						gridProps={{ paddingTop: 2 }}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={closeModal}>{t("form.cancel")}</Button>
					<Button type="submit">{t("form.done")}</Button>
				</DialogActions>
			</form>
		</>
	);
};

export default UISettings;
