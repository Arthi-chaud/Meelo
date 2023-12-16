import {
	AlbumSortingKeys,
	AlbumType,
	AlbumWithRelations,
} from "../../../models/album";
import AlbumItem from "../../list-item/album-item";
import AlbumTile from "../../tile/album-tile";
import Controls, { OptionState } from "../../controls/controls";
import InfiniteView from "../infinite-view";
import { useRouter } from "next/router";
import { useState } from "react";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import { translate, useLanguage } from "../../../i18n/translate";

type AdditionalProps = { type?: AlbumType };

const InfiniteAlbumView = (
	props: InfiniteResourceViewProps<
		AlbumWithRelations<"artist">,
		typeof AlbumSortingKeys,
		AdditionalProps
	> &
		Pick<Parameters<typeof AlbumTile>[0], "formatSubtitle">,
) => {
	const router = useRouter();
	const [options, setOptions] = useState<
		OptionState<typeof AlbumSortingKeys, AdditionalProps>
	>({
		library: null,
		order: props.initialSortingOrder ?? "asc",
		sortBy: props.initialSortingField ?? "name",
		view: props.defaultLayout ?? "grid",
	});
	const language = useLanguage();

	return (
		<>
			<Controls
				options={[
					{
						label: translate((options?.type as AlbumType) ?? "All"),
						name: "type",
						values: ["All", ...AlbumType],
						currentValue: options?.type ?? undefined,
					},
				]}
				onChange={setOptions}
				sortingKeys={AlbumSortingKeys}
				defaultSortingOrder={props.initialSortingOrder}
				defaultSortingKey={props.initialSortingField}
				router={props.light == true ? undefined : router}
				defaultLayout={props.defaultLayout ?? "grid"}
			/>
			<InfiniteView
				view={options?.view ?? props.defaultLayout ?? "grid"}
				query={() =>
					props.query({
						library: options?.library,
						view: options?.view ?? props.defaultLayout ?? "grid",
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						type:
							options?.type == "All" ? undefined : options?.type,
						sortBy: options?.sortBy ?? AlbumSortingKeys[0],
						order: options?.order ?? "asc",
					})
				}
				renderListItem={(item: AlbumWithRelations<"artist">) => (
					<AlbumItem
						album={item}
						key={item.id}
						formatSubtitle={props.formatSubtitle}
					/>
				)}
				renderGridItem={(item: AlbumWithRelations<"artist">) => (
					<AlbumTile
						album={item}
						key={item.id}
						formatSubtitle={props.formatSubtitle}
					/>
				)}
			/>
		</>
	);
};

export default InfiniteAlbumView;
