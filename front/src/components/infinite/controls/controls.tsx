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

import { Button, ButtonGroup, Dialog, Grid, Tooltip } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TranslationKey } from "../../../i18n/i18n";
import { ItemSize, type LayoutOption } from "../../../utils/layout";
import type { Order } from "../../../utils/sorting";
import type Action from "../../actions/action";
import { GridIcon, ListIcon, MinusIcon, PlusIcon } from "../../icons";

type FilterControl<Key extends string> = {
	// Gives the translation key from an item to choose from
	formatItem: (k: Key) => TranslationKey;
	values: Key[] | undefined;
} & (
	| {
			multipleChoice: true;
			selected: Key[];
			onUpdate: (keys: Key[]) => void;
			formatButtonLabel: (selected: Key[]) => TranslationKey;
	  }
	| {
			multipleChoice: false;
			selected: Key | null;
			onUpdate: (key: Key) => void;
			formatButtonLabel: (selected: Key | null) => TranslationKey;
	  }
);

type SortControl<SortingKey extends string> = {
	formatItem: (k: SortingKey) => TranslationKey;
	formatButtonLabel: (sort: SortingKey, order: Order) => TranslationKey;
	sortingKeys: SortingKey[];
	selected: { sort: SortingKey; order: Order };
	onUpdate: (p: { sort: SortingKey; order: Order }) => void;
};

type LayoutControl =
	| { layout: "list"; itemSize: never; enableToggle: false; onUpdate: never }
	| {
			layout: "grid";
			itemSize: ItemSize;
			enableToggle: false;
			onUpdate: (p: { itemSize: ItemSize }) => void;
	  }
	| {
			layout: LayoutOption;
			enableToggle: true;
			itemSize: ItemSize;
			onUpdate: (p: {
				layout: LayoutOption;
				itemSize: ItemSize;
			}) => void;
	  };

// Controls should not maintain state regarding options
// It should rely on the onUpdate function to update external state
const Controls = <
	Filters extends Record<string, FilterControl<FilterKeys>>,
	SortingKey extends string,
	FilterKeys extends string,
>(props: {
	layout: LayoutControl;
	sort?: SortControl<SortingKey>;
	actions?: Action[];
	filters: Filters;
}) => {
	const { t } = useTranslation();
	const [actionModalContent, setActionModalContent] =
		useState<JSX.Element | null>(null);
	const closeModal = () => setActionModalContent(null);

	return (
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
			{/*TODO Filter*/}
			{/*TODO Sort*/}
			<Grid item>
				<ButtonGroup variant="contained">
					{props.layout.layout === "grid" &&
						[
							[
								"xs",
								(currentIndex: number) => currentIndex - 1,
								MinusIcon,
							] as const,
							[
								"xl",
								(currentIndex: number) => currentIndex + 1,
								PlusIcon,
							] as const,
						].map(([size, f, Icon]) => (
							<Button
								key={`size-button-${size}`}
								disabled={props.layout.itemSize === size}
								onClick={() =>
									props.layout.onUpdate({
										layout: props.layout.layout,
										itemSize:
											ItemSize[
												f(
													ItemSize.indexOf(
														props.layout.itemSize,
													),
												)
											],
									})
								}
							>
								<Icon />
							</Button>
						))}
					{props.layout.enableToggle && (
						<Tooltip title={t("changeLayout")}>
							<Button
								onClick={() =>
									props.layout.onUpdate({
										itemSize: props.layout.itemSize,
										layout:
											props.layout.layout === "grid"
												? "list"
												: "grid",
									})
								}
							>
								{props.layout.layout === "grid" ? (
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
					{props.actions?.map((action) => (
						<Button
							key={`action-${action.label}`}
							startIcon={action.icon}
							variant="contained"
							onClickCapture={() => {
								if (action.disabled === true) {
									return;
								}
								action.onClick?.();
								action.dialog &&
									setActionModalContent(
										action.dialog({ close: closeModal }),
									);
							}}
						>
							{t(action.label)}
						</Button>
					)) ?? []}
				</ButtonGroup>
			</Grid>

			<Dialog
				open={actionModalContent !== null}
				onClose={closeModal}
				fullWidth
			>
				{actionModalContent}
			</Dialog>
		</Grid>
	);
};
