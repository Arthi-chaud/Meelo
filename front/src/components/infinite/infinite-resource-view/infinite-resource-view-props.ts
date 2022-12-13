import { MeeloInfiniteQueryFn } from '../../../api/use-query';
import Resource from '../../../models/resource';
import { LayoutOption } from '../../../utils/layout';
import { Order, SortingParameters } from '../../../utils/sorting';

type InfiniteResourceViewProps<
	ResourceType extends Resource,
	SortingKeys extends readonly string[],
	AdditionalQueryParams extends any[]= []
> = {
	query: (
		sort: SortingParameters<SortingKeys>,
		...params: AdditionalQueryParams
	) => ReturnType<MeeloInfiniteQueryFn<ResourceType>>,
	light?: boolean;
	defaultLayout?: LayoutOption;
	initialSortingOrder?: Order;
	initialSortingField?: SortingKeys[number];
};

export default InfiniteResourceViewProps;
