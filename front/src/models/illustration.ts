import { z } from "zod";

const Illustration = z.object({
	/**
	 * Path of the route of the API to get the illustration
	 */
	illustration: z.string().nullable()
});

type Illustration = z.infer<typeof Illustration>;

export default Illustration;
