
abstract class RepositoryInput<T, ORMInputType> {
	public readonly values: T
	
	constructor(values: T) {
		this.values = values;
	}

	abstract buildForORM(): ORMInputType;
}

export default RepositoryInput;