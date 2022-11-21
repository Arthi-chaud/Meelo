import ParseIdentifierPipe from "src/identifier/identifier.base-pipe";
import type LibraryQueryParameters from "./models/library.query-parameters";

class ParseLibraryIdentifierPipe extends ParseIdentifierPipe<LibraryQueryParameters.WhereInput> {}
export default ParseLibraryIdentifierPipe;
