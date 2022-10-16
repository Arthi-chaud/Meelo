import { useRouter } from "next/router"
import { ParsedUrlQuery } from "querystring";

/**
 * Retrives the 'slugOrId' param from route using router
 * @returns the resource identifier.
 */
const useSlugOrId = (param?: ParsedUrlQuery) => {
	if (param)
		return param.slugOrId! as string;
	const router = useRouter();
	return router.query.slugOrId as string;
}

export default useSlugOrId;