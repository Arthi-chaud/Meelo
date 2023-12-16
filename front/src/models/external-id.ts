import * as yup from "yup";

const ExternalId = yup.object({
	/**
	 * Info about the provider
	 */
	provider: yup
		.object({
			/**
			 * Name of the Provider
			 */
			name: yup.string().required(),
			/**
			 * URL to the Homepage of the provider
			 */
			homepage: yup.string().required(),
			/**
			 * API-relative route to the provider's banner
			 */
			banner: yup.string().required(),
			/**
			 * API-relative route to the provider's icon
			 */
			icon: yup.string().required(),
		})
		.required(),
	/**
	 * Value of the External Identifier
	 */
	value: yup.string().required(),
	/**
	 * Description of the resource, from the External Identifier
	 */
	description: yup.string().required().nullable(),
	/**
	 * URL to the related resource
	 */
	url: yup.string().required().nullable(),
});

type ExternalId = yup.InferType<typeof ExternalId>;

export default ExternalId;
