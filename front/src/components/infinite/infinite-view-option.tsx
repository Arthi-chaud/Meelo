import { Check } from "@mui/icons-material";
import {
	Button, Divider, ListItemIcon, Menu, MenuItem
} from "@mui/material";
import { capitalCase } from "change-case";
import { useState } from "react";

type Option<Values extends string[]> = {
	name: string;
	initValue?: Values[number];
	values: Values;
	onSelect?: (value: Values[number]) => void;
}

export type OptionGroup<OptionsValues extends string[][]> = {
	name: string;
	icon?: JSX.Element;
	options: Option<OptionsValues[number]>[];
}

type InfiniteViewDropdownOptionProps<OptionsValues extends string[][]> = {
	option: OptionGroup<OptionsValues>;
}

const InfiniteViewDropdownOption = <Options extends string[][]>(
	props: InfiniteViewDropdownOptionProps<Options>
) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const menuOpen = Boolean(anchorEl);
	const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) =>
		setAnchorEl(event.currentTarget);
	const handleMenuClose = () => setAnchorEl(null);

	return <>
		<Button
			onClick={handleMenuOpen}
			endIcon={props.option.icon}
		>
			{props.option.name}
		</Button>
		<Menu
			anchorEl={anchorEl}
			open={menuOpen}
			onClose={handleMenuClose}
		>
			{ props.option.options.map((option, index, array) =>
				option.values.map((value) =>
					<MenuItem key={value} sx={{ borderRadius: '0' }} selected={option.initValue == value}
						onClick={() => {
							option.onSelect && option.onSelect(value);
							handleMenuClose();
						}}
					>
						<ListItemIcon>
							{ option.initValue == value && <Check />}
						</ListItemIcon>
						{capitalCase(value)}
					</MenuItem>).concat(index + 1 != array.length ? [<Divider key={index}/>] : []))
			}
		</Menu>
	</>;
};

export default InfiniteViewDropdownOption;
