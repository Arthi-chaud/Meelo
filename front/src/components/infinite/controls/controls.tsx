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

import { Button, ButtonGroup, Dialog, Grid } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TranslationKey } from "../../../i18n/i18n";
import type { ItemSize, LayoutOption } from "../../../utils/layout";
import type { Order } from "../../../utils/sorting";
import type Action from "../../actions/action";

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
	| { layout: "list"; enableToggle: false; onUpdate: never }
	| {
			layout: "grid";
			enableToggle: false;
			onUpdate: (itemSize: ItemSize) => void;
	  }
	| {
			layout: LayoutOption;
			enableToggle: false;
			onUpdate: (newLayout: LayoutOption, itemSize: ItemSize) => void;
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
	const [openActionModal, setOpenActionModal] = useState<string | null>(null);
	const closeModal = () => setOpenActionModal(null);

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
			{/*TODO Layout*/}
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
	);
};
