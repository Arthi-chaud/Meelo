/**
 * Retrives the 'slugOrId' param from route using router
 * @returns the resource identifier.
 */
const getSlugOrId = (params: any) => {
	return params.slugOrId as string;
};

export default getSlugOrId;
