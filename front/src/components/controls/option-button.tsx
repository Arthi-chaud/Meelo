import { CheckIcon } from "../icons";
import { Button, Divider, ListItemIcon, Menu, MenuItem } from "@mui/material";
import Option, { OptionGroup } from "./option";
import { useState } from "react";
import Translate from "../../i18n/translate";
import { TranslationKey } from "../../i18n/translations/type";

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
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const menuOpen = Boolean(anchorEl);
	const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) =>
		setAnchorEl(event.currentTarget);
	const handleMenuClose = () => setAnchorEl(null);

	return (
		<>
			<Button onClick={handleMenuOpen} endIcon={props.optionGroup.icon}>
				<Translate
					translationKey={props.optionGroup.name as TranslationKey}
				/>
			</Button>
			<Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
				{props.optionGroup.options.map((option, index, array) =>
					option.values
						.map((value: OptionsKeys[number][number]) => (
							<MenuItem
								key={value}
								sx={{ borderRadius: "0" }}
								selected={option.currentValue == value}
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
									{option.currentValue == value && (
										<CheckIcon />
									)}
								</ListItemIcon>
								{/* If value is not a Translation Key, will fall through */}
								<Translate
									translationKey={value as TranslationKey}
								/>
							</MenuItem>
						))
						.concat(
							index + 1 != array.length ?
								[<Divider key={index} />]
							:	[],
						),
				)}
			</Menu>
		</>
	);
};

export default OptionButton;
