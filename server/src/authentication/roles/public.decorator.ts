import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
/**
 * Route decorator to allow anonymous user to request methods
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
