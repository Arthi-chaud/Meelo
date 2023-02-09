import { z } from "zod";

const Resource = z.object({
	/**
	 * Unique identifier
	 */
	id: z.number()
});

type Resource = z.infer<typeof Resource>;

export default Resource;
