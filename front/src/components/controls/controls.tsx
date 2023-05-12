import {
	Apps, North, South, ViewList
} from "@mui/icons-material";
import {
	Box, Button, ButtonGroup, Dialog, Tooltip
} from "@mui/material";
import { capitalCase } from "change-case";
import { NextRouter } from "next/router";
import { useEffect, useState } from "react";
import Option from "./option";
import OptionButton from "./option-button";
import { LayoutOption, getLayoutParams } from "../../utils/layout";
import { Order, getOrderParams } from "../../utils/sorting";
import parseQueryParam from "../../utils/parse-query-param";
import Action from "../actions/action";
import Translate, { translate, useLanguage } from "../../i18n/translate";
import { TranslationKey } from "../../i18n/translations/type";

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
	actions?: Action[],
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
	const language = useLanguage();
	const [openActionModal, setOpenActionModal] = useState<string | null>(null);
	const closeModal = () => setOpenActionModal(null);

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

	return <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
		<ButtonGroup color='inherit'>
			{ props.actions?.map((action, index) => (
				<Button key={'action-' + action.label} startIcon={action.icon}
					variant='contained'
					color="primary"
					onClickCapture={() => {
						if (action.disabled === true) {
							return;
						}
						action.onClick && action.onClick();
						action.dialog && setOpenActionModal(action.label);
					}}
				>
					{action.label}
					{action.dialog &&
						<Dialog open={openActionModal === action.label}
							onClose={closeModal} fullWidth
						>
							{action.dialog({ close: closeModal })}
						</Dialog>
					}
				</Button>
			)) ?? []}
			<OptionButton
				optionGroup={{
					name: `${translate('sortBy')} ${translate(optionsState.sortBy as TranslationKey)}`,
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
				<Tooltip title={<Translate translationKey='changeLayout'/>}>
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
