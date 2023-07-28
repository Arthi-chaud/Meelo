import { useRouter } from "next/router";
import { useState } from "react";
import {
	SongSortingKeys, SongType, SongWithRelations
} from "../../../models/song";
import Controls, { OptionState } from "../../controls/controls";
import SongItem from "../../list-item/song-item";
import InfiniteView from "../infinite-view";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import translate, { useLanguage } from "../../../i18n/translate";

const InfiniteSongView = (
	props: InfiniteResourceViewProps<
		SongWithRelations<'artist'>,
		typeof SongSortingKeys,
		[type?: SongType]
	> & Pick<Parameters<typeof SongItem>[0], 'formatSubtitle'>
) => {
	const router = useRouter();
	const [options, setOptions] = useState<OptionState<typeof SongSortingKeys>>();
	const language = useLanguage();

	return <>
		<Controls
			options={[
				{
					label: options?.type as SongType ?? 'All',
					name: 'type',
					values: ['All', ...SongType.filter((type) => type != 'Unknown')],
					currentValue: options?.type,
				}
			]}
			onChange={setOptions}
			sortingKeys={SongSortingKeys}
			defaultSortingOrder={props.initialSortingOrder}
			defaultSortingKey={props.initialSortingField}
			router={props.light == true ? undefined : router}
			disableLayoutToggle
			defaultLayout={"list"}
		/>
		<InfiniteView
			view={options?.view ?? 'grid'}
			query={() => props.query({
				sortBy: options?.sortBy ?? 'name',
				order: options?.order ?? 'asc',
			}, options?.type == 'All' ? undefined : options?.type as SongType | undefined)}
			renderListItem={(item: SongWithRelations<'artist'>) => <SongItem song={item} key={item.id} formatSubtitle={props.formatSubtitle} />}
			renderGridItem={(item: SongWithRelations<'artist'>) => <></>}
		/>
	</>;
};

export default InfiniteSongView;
