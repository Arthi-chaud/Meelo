import ParseBaseIdentifierPipe from "src/identifier/identifier.base-pipe";
import type LibraryQueryParameters from "./models/library.query-parameters";

class ParseLibraryIdentifierPipe extends ParseBaseIdentifierPipe<LibraryQueryParameters.WhereInput> {}
export default ParseLibraryIdentifierPipe;