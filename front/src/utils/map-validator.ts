import * as yup from 'yup';

const MapValidator = <KeyType extends string | number, ValueType>(
	keyValidator: yup.Schema<KeyType>,
	valueValidator: yup.Schema<ValueType>
) => async (value: unknown): Promise<Record<KeyType, ValueType>> => {
		const unsafeObject = value as Record<KeyType, ValueType>;
		const validatedObject = {} as Record<KeyType, ValueType>;

		for (const discIndex in unsafeObject) {
			const [validatedKey, validatedValue] = await Promise.all([
				keyValidator.validate(discIndex)
					.then((validated) => keyValidator.cast(validated)),
				valueValidator.validate(unsafeObject[discIndex])
					.then((validated) => valueValidator.cast(validated))
			]);

			validatedObject[validatedKey] = validatedValue;
		}
		return validatedObject;
	};

export default MapValidator;
