import ParseResourceIdentifierPipe from "src/identifier/identifier.pipe";
import type LibraryQueryParameters from "./models/library.query-parameters";

class ParseLibraryIdentifierPipe extends ParseResourceIdentifierPipe<LibraryQueryParameters.WhereInput> {};
export default ParseLibraryIdentifierPipe;