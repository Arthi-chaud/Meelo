import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import buildSlug from './build-slug';

@Injectable()
export class ParseSlugPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return buildSlug(value);
  }
}