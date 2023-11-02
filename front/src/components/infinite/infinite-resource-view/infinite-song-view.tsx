import { useRouter } from "next/router";
import { useState } from "react";
import {
	SongSortingKeys, SongType, SongWithRelations
} from "../../../models/song";
import Controls, { OptionState } from "../../controls/controls";
import SongItem from "../../list-item/song-item";
import InfiniteView from "../infinite-view";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import { useLanguage } from "../../../i18n/translate";

type AdditionalProps = {
	type?: SongType
}

const InfiniteSongView = (
	props: InfiniteResourceViewProps<
		SongWithRelations<'artist' | 'featuring'>,
		typeof SongSortingKeys,
		AdditionalProps
	> & Pick<Parameters<typeof SongItem>[0], 'formatSubtitle'>
) => {
	const router = useRouter();
	const [options, setOptions] = useState<OptionState<typeof SongSortingKeys, AdditionalProps>>();
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
			view={options?.view ?? 'list'}
			query={() => props.query({
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				type: (options?.type == 'All') ? undefined : options?.type as SongType,
				sortBy: options?.sortBy ?? 'name',
				order: options?.order ?? 'asc',
				view: "grid",
				library: options?.library ?? null
			})}
			renderListItem={(item: SongWithRelations<'artist' | 'featuring'>) => <SongItem song={item} key={item.id} formatSubtitle={props.formatSubtitle} />}
			renderGridItem={(item: SongWithRelations<'artist' | 'featuring'>) => <></>}
		/>
	</>;
};

export default InfiniteSongView;
