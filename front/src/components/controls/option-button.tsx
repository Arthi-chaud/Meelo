import { Check } from '@mui/icons-material';
import {
	Button, Divider, ListItemIcon, Menu, MenuItem
} from '@mui/material';
import { capitalCase } from 'change-case';
import Option, { OptionGroup } from './option';
import { useState } from 'react';

type OptionButtonProps<
	Options extends Option<OptionsKeys[number]>[],
	OptionsKeys extends string[][]
> = {
	optionGroup: OptionGroup<Options, OptionsKeys>;
	onSelect?: (selected: { name: Options[number]['name'], value: OptionsKeys[number][number] }) => void
}

/**
 * @param props an option group
 * @returns Dropdown Button with selector.
 */

const OptionButton = <
	Options extends Option<OptionsKeys[number]>[],
	OptionsKeys extends string[][]
>(props: OptionButtonProps<Options, OptionsKeys>) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const menuOpen = Boolean(anchorEl);
	const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) =>
		setAnchorEl(event.currentTarget);
	const handleMenuClose = () => setAnchorEl(null);

	return <>
		<Button
			onClick={handleMenuOpen}
			endIcon={props.optionGroup.icon}
		>
			{props.optionGroup.name}
		</Button>
		<Menu
			anchorEl={anchorEl}
			open={menuOpen}
			onClose={handleMenuClose}
		>
			{ props.optionGroup.options.map((option, index, array) =>
				option.values.map((value: OptionsKeys[number][number]) =>
					<MenuItem key={value} sx={{ borderRadius: '0' }} selected={option.currentValue == value}
						onClick={() => {
							if (props.onSelect) {
								props.onSelect({
									name: option.name,
									value: value
								});
							}
							handleMenuClose();
						}}
					>
						<ListItemIcon>
							{ option.currentValue == value && <Check />}
						</ListItemIcon>
						{capitalCase(value)}
					</MenuItem>).concat(index + 1 != array.length ? [<Divider key={index}/>] : []))
			}
		</Menu>
	</>;
};

export default OptionButton;
