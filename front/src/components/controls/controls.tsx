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

import { AscIcon, DescIcon, GridIcon, ListIcon } from "../icons";
import {
	Button,
	ButtonGroup,
	Dialog,
	Grid,
	Tooltip,
	useTheme,
} from "@mui/material";
import { NextRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Option from "./option";
import OptionButton from "./option-button";
import { LayoutOption, getLayoutParams } from "../../utils/layout";
import { Order, getOrderParams } from "../../utils/sorting";
import parseQueryParam from "../../utils/parse-query-param";
import Action from "../actions/action";
import { TranslationKey } from "../../i18n/i18n";
import toast from "react-hot-toast";
import API from "../../api/api";
import { prepareMeeloInfiniteQuery } from "../../api/use-query";
// eslint-disable-next-line no-restricted-imports
import { useInfiniteQuery as useReactInfiniteQuery } from "react-query";
import Fade from "../fade";
import globalLibrary from "../../utils/global-library";
import { useTranslation } from "react-i18next";

export type Toggle = {
	name: string;
	label: TranslationKey;
	defaultValue?: boolean;
};

export type OptionState<
	SortingKeys extends readonly string[],
	AdditionalProps extends object = object,
> = {
	view: LayoutOption;
	order: Order;
	sortBy: SortingKeys[number];
	library: string | null;
} & AdditionalProps;

type ControllerProps<
	SortingKeys extends readonly string[],
	Options extends Option<Values[number]>[],
	Values extends string[][],
> = {
	options?: Options;
	actions?: Action[];
	toggles?: Toggle[];
	disableSorting?: true;
	sortingKeys: SortingKeys;
	defaultSortingKey?: SortingKeys[number];
	defaultSortingOrder?: Order;
	defaultLayout: LayoutOption;
	disableLayoutToggle?: boolean;
	onChange: (state: OptionState<SortingKeys>) => void;
	/**
	 * If defined, will push changes as query parameters in router
	 */
	router?: NextRouter;
	disableLibrarySelector?: true;
};

const Controls = <
	SortingKeys extends readonly string[],
	Options extends Option<Values[number]>[],
	Values extends string[][],
>(
	props: ControllerProps<SortingKeys, Options, Values>,
) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const librariesQuery = useReactInfiniteQuery({
		...prepareMeeloInfiniteQuery(API.getLibraries),
		useErrorBoundary: false,
		onError: () => {
			toast.error(t("librariesLoadFail"));
		},
	});
	const libraries = useMemo(
		() => librariesQuery.data?.pages.at(0)?.items ?? null,
		[librariesQuery.data],
	);
	const [optionsState, setOptionState] = useState<OptionState<SortingKeys>>(
		() => {
			const libraryQuery = Array.isArray(props.router?.query.library)
				? props.router?.query.library?.at(0)
				: props.router?.query.library;
			const baseOptions: OptionState<SortingKeys> = {
				view:
					((props.disableLayoutToggle !== true &&
						getLayoutParams(props.router?.query.view)) ||
						undefined) ??
					props.defaultLayout,
				sortBy:
					parseQueryParam(
						props.router?.query.sortBy,
						props.sortingKeys,
					) ??
					props.defaultSortingKey ??
					props.sortingKeys[0],
				order:
					getOrderParams(props.router?.query.order) ??
					props.defaultSortingOrder ??
					"asc",
				library: props.disableLibrarySelector
					? null
					: (libraryQuery ?? null),
			};

			props.options?.forEach((option) => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				baseOptions[option.name] =
					parseQueryParam(
						props.router?.query[option.name],
						option.values,
					) ?? option.values[0];
			});
			props.toggles?.forEach((option) => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				baseOptions[option.name] =
					(parseQueryParam(props.router?.query[option.name], [
						"false",
						"true",
					]) ?? "false") === "true";
			});
			return baseOptions;
		},
	);
	const [openActionModal, setOpenActionModal] = useState<string | null>(null);
	const closeModal = () => setOpenActionModal(null);

	/**
	 * To pass the options to parent after initialization
	 */
	useEffect(() => {
		props.onChange(optionsState);
	}, [optionsState]);

	const updateOptionState = ({
		name,
		value,
	}: {
		name: string;
		value: boolean | string | null;
	}) => {
		setOptionState({ ...optionsState, [name]: value });
		value = value?.toString() ?? null;
		if (props.router) {
			const path = props.router.asPath.split("?")[0];
			const params = new URLSearchParams(
				props.router.asPath.split("?").at(1) ?? "",
			);

			if (value) {
				params.set(name, value);
			} else {
				params.delete(name);
			}
			props.router.push(`${path}?${params.toString()}`, undefined, {
				shallow: true,
			});
		}
	};

	if (libraries === null) {
		return <></>;
	}

	return (
		<Fade in>
			<Grid
				container
				gap={1}
				sx={{
					zIndex: 1000,
					width: "100%",
					display: "flex",
					justifyContent: "center",
					marginBottom: 2,
					position: "sticky",
					top: 16,
					left: 0,
				}}
			>
				<Grid item>
					<ButtonGroup variant="contained">
						{props.disableLibrarySelector !== true && (
							<OptionButton
								optionGroup={{
									name:
										optionsState.library ??
										t("allLibraries"),
									options: [
										{
											name: "library",
											values: [
												globalLibrary,
												...libraries,
											].map((library) => library.name),
											currentValue:
												[
													globalLibrary,
													...libraries,
												].find(
													({ slug }) =>
														slug ==
														optionsState.library,
												)?.name ?? globalLibrary.name,
										},
									],
								}}
								onSelect={({ name, value }) => {
									if (value == globalLibrary.name) {
										updateOptionState({
											name,
											value: null,
										});
									} else {
										updateOptionState({
											name,
											value:
												libraries.find(
													(lib) => lib.name == value,
												)?.slug ?? null,
										});
									}
								}}
							/>
						)}
						{!props.disableSorting && (
							<OptionButton
								optionGroup={{
									name: `${t("sortBy")} ${t(
										optionsState.sortBy as TranslationKey,
									)}`,
									icon:
										optionsState.order == "desc" ? (
											<DescIcon />
										) : (
											<AscIcon />
										),
									options: [
										{
											name: "sortBy",
											values: props.sortingKeys,
											currentValue: optionsState.sortBy,
										},
										{
											name: "order",
											values: ["asc", "desc"],
											currentValue: optionsState.order,
										},
									],
								}}
								onSelect={updateOptionState}
							/>
						)}
						{props.options?.map((option) => {
							return (
								<OptionButton
									key={option.name}
									optionGroup={{
										name: option.label ?? option.name,
										icon: option.icon,
										options: [
											{
												...option,
												// eslint-disable-next-line max-len
												currentValue:
													optionsState[
														option.name as keyof typeof optionsState
													] ?? undefined,
											},
										],
									}}
									onSelect={updateOptionState}
								/>
							);
						})}
						{props.toggles?.map((toggle) => (
							<Button
								key={toggle.name}
								onClick={() => {
									updateOptionState({
										name: toggle.name,
										value:
											!optionsState[
												toggle.name as keyof OptionState<SortingKeys>
											],
									});
								}}
							>
								{t(toggle.label)}
							</Button>
						))}
						{props.disableLayoutToggle !== true && (
							<Tooltip title={t("changeLayout")}>
								<Button
									onClick={() =>
										updateOptionState({
											name: "view",
											value:
												optionsState.view == "grid"
													? "list"
													: "grid",
										})
									}
								>
									{optionsState.view == "grid" ? (
										<ListIcon />
									) : (
										<GridIcon />
									)}
								</Button>
							</Tooltip>
						)}
					</ButtonGroup>
				</Grid>
				<Grid item>
					<ButtonGroup variant="contained">
						{props.actions?.map((action, index) => (
							<Button
								key={"action-" + action.label}
								startIcon={action.icon}
								variant="contained"
								onClickCapture={() => {
									if (action.disabled === true) {
										return;
									}
									action.onClick && action.onClick();
									action.dialog &&
										setOpenActionModal(action.label);
								}}
							>
								{t(action.label)}
								{action.dialog && (
									<Dialog
										open={openActionModal === action.label}
										onClose={closeModal}
										fullWidth
									>
										{action.dialog({ close: closeModal })}
									</Dialog>
								)}
							</Button>
						)) ?? []}
					</ButtonGroup>
				</Grid>
			</Grid>
		</Fade>
	);
};

export default Controls;
