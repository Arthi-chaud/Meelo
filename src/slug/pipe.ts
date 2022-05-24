import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { Slug } from './slug';

@Injectable()
export class ParseSlugPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): Slug {
    return new Slug(value);
  }
}