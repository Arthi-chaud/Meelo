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
	Button,
	ButtonGroup,
	Dialog,
	Divider,
	Grid,
	ListItemIcon,
	Menu,
	MenuItem,
	Tooltip,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TranslationKey } from "../../../i18n/i18n";
import { ItemSize } from "../../../utils/layout";
import type Action from "../../actions/action";
import {
	AscIcon,
	CheckIcon,
	DescIcon,
	GridIcon,
	ListIcon,
	MinusIcon,
	PlusIcon,
} from "../../icons";
import type { LayoutControl } from "./layout";
import type { SortControl } from "./sort";

type FilterControl<Key extends string> = {
	// Gives the translation key from an item to choose from
	formatItem: (k: Key) => TranslationKey;
	values: Key[] | undefined;
	buttonLabel: TranslationKey;
	buttonIcon: JSX.Element | undefined;
} & (
	| {
			multipleChoice: true;
			selected: Key[];
			onUpdate: (keys: Key[]) => void;
	  }
	| {
			multipleChoice: false;
			selected: Key | null;
			onUpdate: (key: Key | null) => void;
	  }
);

// Controls should not maintain state regarding options
// It should rely on the onUpdate function to update external state
export const Controls = <
	Filters extends FilterControl<FilterKeys>[],
	SortingKey extends string,
	FilterKeys extends string,
>(props: {
	layout: LayoutControl;
	sort?: SortControl<SortingKey>;
	actions?: Action[];
	filters: Filters;
}) => {
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
			{props.filters.length > 0 && (
				<Grid item>
					{props.filters.map((filter, idx) => (
						<FilterMenuButton key={idx} filter={filter} />
					))}
				</Grid>
			)}
			{props.sort && (
				<Grid item>
					<SortMenuButton sort={props.sort} />
				</Grid>
			)}
			<Grid item>
				<LayoutButtonGroup layout={props.layout} />
			</Grid>
			<Grid item>
				<ActionButtonGroup actions={props.actions ?? []} />
			</Grid>
		</Grid>
	);
};

const FilterMenuButton = <FilterKeys extends string>({
	filter,
}: { filter: FilterControl<FilterKeys> }) => {
	const { t } = useTranslation();
	return (
		<MenuButton
			label={filter.values === undefined ? "loading" : filter.buttonLabel}
			icon={filter.values && filter.buttonIcon}
			items={(closeMenu) => (
				<>
					{filter.values?.map((key) => (
						<MenuItem
							key={key}
							selected={filter.selected === key}
							onClick={() => {
								if (filter.multipleChoice) {
									const selectedKeys =
										filter.selected.includes(key)
											? filter.selected.filter(
													(k) => k !== key,
												)
											: [key, ...filter.selected];
									filter.onUpdate(selectedKeys);
								} else {
									filter.onUpdate(
										filter.selected === key ? null : key,
									);
								}
								// TODO Not close at every select
								closeMenu();
							}}
						>
							<ListItemIcon>
								{(filter.multipleChoice &&
									filter.selected.includes(key)) ||
								filter.selected === key ? (
									<CheckIcon />
								) : undefined}
							</ListItemIcon>
							{t(filter.formatItem(key))}
						</MenuItem>
					))}
					<Divider />
				</>
			)}
		/>
	);
};

const SortMenuButton = <SortingKey extends string>({
	sort,
}: { sort: SortControl<SortingKey> }) => {
	const { t } = useTranslation();
	return (
		<MenuButton
			label={sort.buttonLabel}
			icon={sort.selected.order === "asc" ? <AscIcon /> : <DescIcon />}
			items={(closeMenu) => (
				<>
					{sort?.sortingKeys.map((key) => (
						<MenuItem
							key={key}
							selected={sort.selected.sort === key}
							onClick={() => {
								sort?.onUpdate({
									sort: key,
									order:
										sort.selected.sort === key
											? "asc"
											: sort.selected.order === "asc"
												? "desc"
												: "asc",
								});
								// TODO Not close at every select
								closeMenu();
							}}
						>
							<ListItemIcon>
								{sort?.selected.sort === key ? (
									sort.selected.order === "asc" ? (
										<AscIcon />
									) : (
										<DescIcon />
									)
								) : undefined}
							</ListItemIcon>
							{t(sort!.formatItem(key))}
						</MenuItem>
					))}
					<Divider />
				</>
			)}
		/>
	);
};

const LayoutButtonGroup = ({ layout }: { layout: LayoutControl }) => {
	const { t } = useTranslation();
	return (
		<ButtonGroup variant="contained">
			{layout.layout === "grid" &&
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
						disabled={layout.itemSize === size}
						onClick={() =>
							layout.onUpdate({
								layout: layout.layout,
								itemSize:
									ItemSize[
										f(ItemSize.indexOf(layout.itemSize))
									],
							})
						}
					>
						<Icon />
					</Button>
				))}
			{layout.enableToggle && (
				<Tooltip title={t("changeLayout")}>
					<Button
						onClick={() =>
							layout.onUpdate({
								itemSize: layout.itemSize,
								layout:
									layout.layout === "grid" ? "list" : "grid",
							})
						}
					>
						{layout.layout === "grid" ? <ListIcon /> : <GridIcon />}
					</Button>
				</Tooltip>
			)}
		</ButtonGroup>
	);
};

const ActionButtonGroup = ({ actions }: { actions: Action[] }) => {
	const { t } = useTranslation();
	const [actionModalContent, setActionModalContent] =
		useState<JSX.Element | null>(null);
	const closeModal = () => setActionModalContent(null);

	return (
		<>
			<ButtonGroup variant="contained">
				{actions.map((action) => (
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
				))}
			</ButtonGroup>

			<Dialog
				open={actionModalContent !== null}
				onClose={closeModal}
				fullWidth
			>
				{actionModalContent}
			</Dialog>
		</>
	);
};

const MenuButton = (props: {
	label: TranslationKey;
	icon: JSX.Element | undefined;
	items: (closeMenu: () => void) => JSX.Element;
}) => {
	const { t } = useTranslation();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const menuOpen = Boolean(anchorEl);
	const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) =>
		setAnchorEl(event.currentTarget);
	const handleMenuClose = () => setAnchorEl(null);
	// TODO Remove border radius or menu items

	return (
		<>
			<Button onClick={handleMenuOpen} endIcon={props.icon}>
				{t(props.label as TranslationKey)}
			</Button>
			<Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
				{props.items(handleMenuClose)}
			</Menu>
		</>
	);
};
