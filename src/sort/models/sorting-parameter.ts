import type RequireOnlyOne from "src/utils/require-only-one";
import type SortingOrder from "./sorting-order";

type SortingParameter<Keys extends string> = RequireOnlyOne<Record<Keys, SortingOrder>>;
export default SortingParameter;