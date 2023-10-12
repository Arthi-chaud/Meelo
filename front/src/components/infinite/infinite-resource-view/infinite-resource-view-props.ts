import { MeeloInfiniteQueryFn } from '../../../api/use-query';
import Resource from '../../../models/resource';
import { LayoutOption } from '../../../utils/layout';
import { Order } from '../../../utils/sorting';
import { OptionState } from '../../controls/controls';

type InfiniteResourceViewProps<
	ResourceType extends Resource,
	SortingKeys extends readonly string[]
> = {
	query: (
		options: OptionState<SortingKeys>
	) => ReturnType<MeeloInfiniteQueryFn<ResourceType>>,
	light?: boolean;
	defaultLayout?: LayoutOption;
	initialSortingOrder?: Order;
	initialSortingField?: SortingKeys[number];
};

export default InfiniteResourceViewProps;
