import { Query } from "@nestjs/common";
import ParseBaseRelationIncludePipe from 'src/relation-include/relation-include.pipe';
/**
 * Query parame decorator to parse relation includes
 * @param keys
 * @returns
 */
export default function RelationIncludeQuery(keys: readonly string[]) {
	return Query('with', new ParseBaseRelationIncludePipe(keys));
}
