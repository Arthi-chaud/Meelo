import { capitalCase } from "change-case";
import Resource from "../../models/resource";
import InfiniteView, { InfiniteViewProps } from "./infinite-view";
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';

type InfiniteSortableView<
	T extends Resource, Options extends (string[] | SortingKeys)[],
	SortingKeys extends string[]
> = {
	sortingFields: SortingKeys,
	initialSortingField: SortingKeys[number]
	initialSortingOrder: 'asc' | 'desc';
	onSortingFieldSelect?: (selected: SortingKeys[number]) => void;
	onSortingOrderSelect?: (selected: 'asc' | 'desc') => void;
} & InfiniteViewProps<T, Options>;

const InfiniteSortableView = <
	T extends Resource, Options extends (string[] | SortingKeys)[],
	SortingKeys extends string[]
>(props: InfiniteSortableView<T, Options, SortingKeys>) => {
	return <InfiniteView<T, Options>
		{...props}
		options={[
			{
				name: `Sort by ${capitalCase(props.initialSortingField)}`,
				icon: props.initialSortingOrder == 'desc' ? <SouthIcon/> : <NorthIcon/>,
				options: [
					{ name: 'field', values: props.sortingFields, initValue: props.initialSortingField, onSelect: props.onSortingFieldSelect },
					{
						name: 'order', values: ['asc', 'desc'],
						initValue: props.initialSortingOrder,
						onSelect: (newOrder) => props.onSortingOrderSelect && props.onSortingOrderSelect(newOrder as 'asc' | 'desc')
					}
				]
			},
			...props.options,
		]}
	/>;
};

export default InfiniteSortableView;
