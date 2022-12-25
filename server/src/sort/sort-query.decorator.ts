import { Query } from "@nestjs/common";
import ParseSortParameterPipe from "./sort.pipe";

export default function SortingQuery(keys: readonly string[]) {
	return Query(new ParseSortParameterPipe(keys));
}
