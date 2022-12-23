import {
	Apps, North, South, ViewList
} from "@mui/icons-material";
import {
	Box, Button, ButtonGroup, Tooltip
} from "@mui/material";
import { capitalCase } from "change-case";
import { NextRouter } from "next/router";
import { useEffect, useState } from "react";
import Option from "./option";
import OptionButton from "./option-button";
import { LayoutOption, getLayoutParams } from "../../utils/layout";
import { Order, getOrderParams } from "../../utils/sorting";
import parseQueryParam from "../../utils/parse-query-param";

export type OptionState<
	SortingKeys extends readonly string[],
> = {
	view: LayoutOption,
	order: Order,
	sortBy: SortingKeys[number],
} & Record<string, string>

type ControllerProps<
	SortingKeys extends readonly string[],
	Options extends Option<Values[number]>[],
	Values extends string[][]
> = {
	options?: Options;
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
};

const Controls = <
	SortingKeys extends readonly string[],
	Options extends Option<Values[number]>[],
	Values extends string[][],
>(props: ControllerProps<SortingKeys, Options, Values>) => {
	const [optionsState, setOptionState] = useState<OptionState<SortingKeys>>(() => {
		const baseOptions: OptionState<SortingKeys> = {
			view: (props.disableLayoutToggle !== true &&
				getLayoutParams(props.router?.query.view) || undefined)
				?? props.defaultLayout,
			sortBy: parseQueryParam(props.router?.query.sortBy, props.sortingKeys)
				?? props.defaultSortingKey
				?? props.sortingKeys[0],
			order: getOrderParams(props.router?.query.order)
				?? props.defaultSortingOrder
				?? 'asc',
		};

		props.options?.forEach((option) => {
			baseOptions[option.name] = parseQueryParam(
				props.router?.query[option.name], option.values
			) ?? option.values[0];
		});
		return baseOptions;
	});

	/**
	 * To pass the options to parent after initialization
	 */
	useEffect(() => {
		props.onChange(optionsState);
	}, [optionsState]);

	const updateOptionState = ({ name, value }: { name: string, value: string }) => {
		setOptionState({ ...optionsState, [name]: value });
		if (props.router) {
			const path = props.router.asPath.split('?')[0];
			const params = new URLSearchParams(props.router.asPath.split('?').at(1) ?? '');

			params.set(name, value);
			props.router.push(`${path}?${params.toString()}`, undefined, { shallow: true });
		}
	};

	return <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', marginY: 2 }}>
		<ButtonGroup color='inherit'>
			<OptionButton
				optionGroup={{
					name: `Sort by ${capitalCase(optionsState.sortBy)}`,
					icon: optionsState.order == 'desc' ? <South/> : <North/>,
					options: [
						{
							name: 'sortBy',
							values: props.sortingKeys,
							currentValue: optionsState.sortBy,
						},
						{
							name: 'order', values: ['asc', 'desc'],
							currentValue: optionsState.order,
						}
					]
				}}
				onSelect={updateOptionState}
			/>
			{ props.options?.map((option) => {
				return <OptionButton
					key={option.name}
					optionGroup={{
						name: option.label ?? option.name,
						icon: option.icon,
						options: [
							{
								...option,
								currentValue: optionsState[option.name]
							}
						]
					}}
					onSelect={updateOptionState}
				/>;
			})}
			{ props.disableLayoutToggle !== true &&
				<Tooltip title="Change layout">
					<Button onClick={() => updateOptionState(
						{ name: 'view', value: optionsState.view == 'grid' ? 'list' : 'grid' }
					)}>
						{ optionsState.view == 'grid' ? <ViewList/> : <Apps/> }
					</Button>
				</Tooltip>
			}
		</ButtonGroup>
	</Box>;
};

export default Controls;
