import { z } from "zod";

const LibraryTaskResponse = z.object({
	/**
	 * Status of the task
	 */
	status: z.string()
});

type LibraryTaskResponse = z.infer<typeof LibraryTaskResponse>;

export default LibraryTaskResponse;
