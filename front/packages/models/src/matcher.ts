import type { RequireExactlyOne } from "type-fest";
import * as yup from "yup";
export type MatchableResourceType = "artist" | "album" | "song";

export type RefreshMetadataDto = RequireExactlyOne<
	Record<`${MatchableResourceType}Id`, number>
>;

export type ResolveUrlDto = {
	url: string;
	resourceType: MatchableResourceType;
};

export const ResolveUrlResponse = yup.object({
	url: yup.string().required(),
	providerId: yup.number().required(),
});
export type ResolveUrlResponse = yup.InferType<typeof ResolveUrlResponse>;
