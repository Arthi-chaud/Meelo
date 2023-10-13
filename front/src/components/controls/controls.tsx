import {
	AscIcon, DescIcon, GridIcon, ListIcon
} from "../icons";
import {
	Box, Button, ButtonGroup, Dialog, Tooltip
} from "@mui/material";
import { NextRouter } from "next/router";
import {
	useEffect, useMemo, useState
} from "react";
import Option from "./option";
import OptionButton from "./option-button";
import { LayoutOption, getLayoutParams } from "../../utils/layout";
import { Order, getOrderParams } from "../../utils/sorting";
import parseQueryParam from "../../utils/parse-query-param";
import Action from "../actions/action";
import Translate, { translate, useLanguage } from "../../i18n/translate";
import { TranslationKey } from "../../i18n/translations/type";
import toast from "react-hot-toast";
import API from "../../api/api";
import { prepareMeeloInfiniteQuery } from "../../api/use-query";
// eslint-disable-next-line no-restricted-imports
import { useInfiniteQuery as useReactInfiniteQuery } from 'react-query';
import Fade from "../fade";
import globalLibrary from "../../utils/global-library";

export type OptionState<
	SortingKeys extends readonly string[],
	AdditionalProps extends object = object
> = {
	view: LayoutOption,
	order: Order,
	sortBy: SortingKeys[number],
	library: string | null
} & AdditionalProps

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
	const librariesQuery = useReactInfiniteQuery({
		...prepareMeeloInfiniteQuery(API.getAllLibraries),
		useErrorBoundary: false,
		onError: () => {
			toast.error(translate('librariesLoadFail'));
		}
	});
	const libraries = useMemo(
		() => librariesQuery.data?.pages.at(0)?.items ?? null,
		[librariesQuery.data]
	);
	const [optionsState, setOptionState] = useState<OptionState<SortingKeys>>(() => {
		const libraryQuery = Array.isArray(props.router?.query.library)
			? props.router?.query.library?.at(0)
			: props.router?.query.library;
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
			library: libraryQuery ?? null
		};

		props.options?.forEach((option) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
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

	const updateOptionState = ({ name, value }: { name: string, value: string | null }) => {
		setOptionState({ ...optionsState, [name]: value });
		if (props.router) {
			const path = props.router.asPath.split('?')[0];
			const params = new URLSearchParams(props.router.asPath.split('?').at(1) ?? '');

			if (value) {
				params.set(name, value);
			} else {
				params.delete(name);
			}
			props.router.push(`${path}?${params.toString()}`, undefined, { shallow: true });
		}
	};

	if (libraries === null) {
		return <></>;
	}

	return <Fade in>
		<Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
			<ButtonGroup color='inherit'>
				<OptionButton
					optionGroup={{
						name: optionsState.library ?? translate('allLibraries'),
						options: [
							{
								name: 'library',
								values: [globalLibrary, ...libraries]
									.map((library) => library.name),
								currentValue: [globalLibrary, ...libraries]
									.find(({ slug }) => slug == optionsState.library)?.name
									?? globalLibrary.name,
							},
						]
					}}
					onSelect={({ name, value }) => {
						if (value == globalLibrary.name) {
							updateOptionState({ name, value: null });
						} else {
							updateOptionState({
								name,
								value: libraries.find((lib) => lib.name == value)?.slug ?? null
							});
						}
					}}
				/>
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
						<Translate translationKey={action.label}/>
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
						icon: optionsState.order == 'desc' ? <DescIcon/> : <AscIcon/>,
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
									// eslint-disable-next-line max-len
									currentValue: optionsState[option.name as keyof typeof optionsState] ?? undefined
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
							{ optionsState.view == 'grid' ? <ListIcon/> : <GridIcon/> }
						</Button>
					</Tooltip>
				}
			</ButtonGroup>
		</Box>
	</Fade>;
};

export default Controls;
