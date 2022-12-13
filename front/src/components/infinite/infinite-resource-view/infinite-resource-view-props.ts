import { MeeloInfiniteQueryFn } from '../../../api/use-query';
import Resource from '../../../models/resource';
import { Order, SortingParameters } from '../../../utils/sorting';

type InfiniteResourceViewProps<
	ResourceType extends Resource,
	SortingKeys extends readonly string[]
> = {
	query: (sort: SortingParameters<SortingKeys>) => ReturnType<MeeloInfiniteQueryFn<ResourceType>>,
	light?: boolean;
	initialSortingOrder?: Order;
	initialSortingField?: SortingKeys[number];
};

export default InfiniteResourceViewProps;
