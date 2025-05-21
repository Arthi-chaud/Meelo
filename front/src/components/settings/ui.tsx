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
	Dialog,
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
import { Book1, Star, Warning2 } from "iconsax-react";
import { HookTextField, useHookForm } from "mui-react-hook-form-plus";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { useLocalStorage } from "usehooks-ts";
import { useQuery, useQueryClient } from "~/api/hook";
import { getScrobblerStatus } from "~/api/queries";
import SectionHeader from "~/components/section-header";
import { type Language, Languages, persistLanguage } from "~/i18n/i18n";
import { type Scrobbler, Scrobblers } from "~/models/scrobblers";
import { CheckIcon, OpenExternalIcon } from "../icons";

const SettingGroupStyle = {
	paddingTop: 1,
	paddingBottom: 2,
	rowSpacing: 4,
} as const;

const InputContainerStyle = {
	justifyContent: "flex-end",
	display: "flex",
} as const;

const RepositoryUrl = "https://github.com/Arthi-chaud/meelo";
const LinkIconStyle = { marginBottom: -5, marginRight: 5 };

const UISettings = () => {
	const { t, i18n } = useTranslation();
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
								{t(`settings.ui.lang.${language}`)}
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
			<SectionHeader heading={t("settings.ui.project")} />
			<p>
				<Star style={LinkIconStyle} />
				{t("settings.ui.external.enjoyingTheProject")}{" "}
				<Link
					style={{ textDecoration: "underline" }}
					href={RepositoryUrl}
				>
					{t("settings.ui.external.starOnGithub")}
				</Link>
			</p>
			<p>
				<Warning2 style={LinkIconStyle} />
				{t("settings.ui.external.encounteredABug")}{" "}
				<Link
					style={{ textDecoration: "underline" }}
					href={`${RepositoryUrl}/issues`}
				>
					{t("settings.ui.external.openAnIssue")}
				</Link>
			</p>
			<p>
				<Book1 style={LinkIconStyle} />
				<Link
					style={{ textDecoration: "underline" }}
					href="https://github.com/Arthi-chaud/Meelo/wiki"
				>
					{t("settings.ui.external.readTheDoc")}
				</Link>
			</p>
		</NoSsr>
	);
};

const ScrobblersSection = () => {
	const scrobblers = useQuery(() => getScrobblerStatus());
	const { t } = useTranslation();
	const [listenbrainzModalIsOpen, openListenBrainzModal] = useState(false);
	const closeModal = () => openListenBrainzModal(false);
	const queryClient = useQueryClient();
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

	const listenBrainzMutation = useMutation(
		async (dto: typeof defaultValues) => {
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
					queryClient.client.invalidateQueries("scrobblers");
				});
		},
	);
	const router = useRouter();

	const defaultValues = { token: "", instanceUrl: "" as string | null };
	const { registerState, handleSubmit } = useHookForm({
		defaultValues,
	});
	const onSubmit = (values: typeof defaultValues) => {
		listenBrainzMutation.mutate(values);
		closeModal();
	};
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
					<>
						{Scrobblers.map(
							(scrobbler) =>
								displayScrobbler(scrobbler) && (
									<Button
										disabled={scrobblers.data.connected.includes(
											scrobbler,
										)}
										variant="outlined"
										onClick={async () => {
											switch (scrobbler) {
												case "ListenBrainz":
													openListenBrainzModal(true);
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
										startIcon={
											scrobblers.data.connected.includes(
												scrobbler,
											) ? (
												<CheckIcon size={"1em"} />
											) : undefined
										}
										endIcon={
											!scrobblers.data.connected.includes(
												scrobbler,
											) ? (
												<OpenExternalIcon
													size={"1em"}
												/>
											) : undefined
										}
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

			<Dialog
				open={listenbrainzModalIsOpen}
				onClose={closeModal}
				fullWidth
			>
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
								label: t(
									"form.scrobblers.listenbrainz.tokenLabel",
								),
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
			</Dialog>
		</Box>
	);
};

export default UISettings;
