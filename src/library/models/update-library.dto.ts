import { PartialType } from "@nestjs/swagger";
import CreateLibraryDto from './create-library.dto';

export default class UpdatelibraryDTO extends PartialType(CreateLibraryDto) {}