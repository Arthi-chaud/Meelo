import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

/**
 * Base of Any external provider's settings
 */
export default class BaseProviderSettings {
	@ApiProperty()
	@IsOptional()
	@IsBoolean()
	enabled = true;
}
