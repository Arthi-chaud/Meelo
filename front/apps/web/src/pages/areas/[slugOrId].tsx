import { Box, Link, Skeleton, Stack, Typography } from "@mui/material";
import type { NextPageContext } from "next";
import { useRouter } from "next/router";
import { Fragment } from "react";
import type { GetPropsTypesFrom, Page } from "ssr";
import { getArea, getArtists, getLabels, getParentAreas } from "@/api/queries";
import { AreaIcon } from "@/ui/icons";
import { useQuery } from "~/api";
import { Head } from "~/components/head";
import InfiniteArtistView from "~/components/infinite/resource/artist";
import { InfiniteLabelView } from "~/components/infinite/resource/label";
import { TabPage } from "~/components/tab-page";
import getSlugOrId from "~/utils/getSlugOrId";

const prepareSSR = (context: NextPageContext) => {
	const areaIdentifier = getSlugOrId(context.query);
	const defaultQuerySortParams = { sortBy: "name", order: "asc" } as const;

	return {
		additionalProps: { areaIdentifier: areaIdentifier },
		queries: [getArea(areaIdentifier)],
		infiniteQueries: [
			getArtists({ area: areaIdentifier }, defaultQuerySortParams, [
				"illustration",
			]),
			getLabels({ area: areaIdentifier }, defaultQuerySortParams),
		],
	};
};

const tabs = ["artist", "label"] as const;

const AreaPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const router = useRouter();
	const areaIdentifier = props?.areaIdentifier ?? getSlugOrId(router.query);
	const area = useQuery(getArea, areaIdentifier);
	const { data: parentAreas } = useQuery(getParentAreas, areaIdentifier);

	return (
		<TabPage
			tabs={tabs}
			urlFromTab={(newTab) => `/areas/${areaIdentifier}?t=${newTab}`}
			translateTab={(tab) => `models.${tab}_plural`}
			header={
				<>
					<Head title={area.data?.name} />
					<Box
						sx={{
							width: "100%",
							gap: 2,
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
							display: "flex",
							marginY: 5,
						}}
					>
						<Stack
							direction="row"
							sx={{
								alignItems: "center",
								justifyContent: "center",
								textAlign: "center",
								gap: 1,
							}}
						>
							<AreaIcon />
							<Typography
								variant="h5"
								sx={{ fontWeight: "bold" }}
							>
								{area.data?.name ?? (
									<Skeleton width={"100px"} />
								)}
							</Typography>
						</Stack>
						<Stack
							direction="row"
							sx={{
								width: "100%",
								justifyContent: "center",
								textAlign: "center",
							}}
						>
							{parentAreas?.map((area, idx, areas) => (
								<Fragment key={area.id}>
									<Typography
										variant="body1"
										color="textSecondary"
										style={{
											whiteSpace: "pre",
										}}
									>
										<Link
											style={{
												textDecoration: "underline",
											}}
											href={`/areas/${area.id}`}
										>
											{area.name}
										</Link>
										{idx < areas.length - 1
											? "  <  "
											: null}
									</Typography>
								</Fragment>
							)) ?? <Skeleton width={"100px"} />}
						</Stack>
					</Box>
				</>
			}
			render={(tab) => {
				switch (tab) {
					case "artist":
						return (
							<InfiniteArtistView
								query={({ libraries, sortBy, order }) =>
									getArtists(
										{
											area: areaIdentifier,
											library: libraries,
										},
										{ sortBy, order },
										["illustration"],
									)
								}
							/>
						);
					case "label":
						return (
							<InfiniteLabelView
								query={({ sortBy, order }) =>
									getLabels(
										{ area: areaIdentifier },
										{ sortBy, order },
										[],
									)
								}
							/>
						);
				}
			}}
		/>
	);
};

AreaPage.prepareSSR = prepareSSR;

export default AreaPage;
