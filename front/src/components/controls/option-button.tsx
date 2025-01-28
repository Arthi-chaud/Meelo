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

import { Button, Divider, ListItemIcon, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TranslationKey } from "../../i18n/i18n";
import { CheckIcon } from "../icons";
import type Option from "./option";
import type { OptionGroup } from "./option";

type OptionButtonProps<
	Options extends Option<OptionsKeys[number]>[],
	OptionsKeys extends (readonly string[])[],
> = {
	optionGroup: OptionGroup<Options, OptionsKeys>;
	onSelect?: (selected: {
		name: Options[number]["name"];
		value: OptionsKeys[number][number];
	}) => void;
};

/**
 * @param props an option group
 * @returns Dropdown Button with selector.
 */

const OptionButton = <
	Options extends Option<OptionsKeys[number]>[],
	OptionsKeys extends (readonly string[])[],
>(
	props: OptionButtonProps<Options, OptionsKeys>,
) => {
	const { t } = useTranslation();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const menuOpen = Boolean(anchorEl);
	const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) =>
		setAnchorEl(event.currentTarget);
	const handleMenuClose = () => setAnchorEl(null);

	return (
		<>
			<Button onClick={handleMenuOpen} endIcon={props.optionGroup.icon}>
				{t(props.optionGroup.name as TranslationKey)}
			</Button>
			<Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
				{props.optionGroup.options.map((option, index, array) =>
					option.values
						.map((value: OptionsKeys[number][number]) => (
							<MenuItem
								key={value}
								sx={{ borderRadius: "0" }}
								selected={option.currentValue === value}
								onClick={() => {
									if (props.onSelect) {
										props.onSelect({
											name: option.name,
											value: value,
										});
									}
									handleMenuClose();
								}}
							>
								<ListItemIcon>
									{option.currentValue === value && (
										<CheckIcon />
									)}
								</ListItemIcon>
								{/* If value is not a Translation Key, will fall through */}
								{t(value as TranslationKey)}
							</MenuItem>
						))
						.concat(
							index + 1 !== array.length
								? [<Divider key={index} />]
								: [],
						),
				)}
			</Menu>
		</>
	);
};

export default OptionButton;
