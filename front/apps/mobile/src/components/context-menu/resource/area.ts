import { useCallback, useMemo } from "react";
import { getParentAreas } from "@/api/queries";
import type { Area } from "@/models/area";
import { AreaIcon, ArtistIcon, LabelIcon } from "@/ui/icons";
import { useQuery } from "~/api";
import type { ContextMenu, ContextMenuBuilder } from "..";

export const useAreaContextMenu = (
	area: Area | undefined,
): ContextMenuBuilder => {
	const { data: parentAreas } = useQuery(getParentAreas, area?.id);
	const formattedParentAreas = useMemo(
		() =>
			parentAreas?.length === 0
				? null
				: parentAreas?.map((area) => area.name).join(", "),
		[parentAreas],
	);
	return useCallback(() => {
		return {
			header: {
				title: area?.name,
				subtitle: formattedParentAreas,
				illustration: null,
				illustrationProps: { fallbackIcon: AreaIcon },
			},
			items: area
				? [
						[
							{
								label: "actions.seeArtists",
								icon: ArtistIcon,
								href: `/artists?area=${area?.id}`,
							},

							{
								label: "actions.seeLabels",
								icon: LabelIcon,
								href: `/labels?area=${area?.id}`,
							},
						],
					]
				: [],
		} satisfies ContextMenu;
	}, [area, parentAreas]);
};
