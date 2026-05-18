import { ApiBody } from '@nestjs/swagger';
import type {
	OpenApiObjectSchema,
	OpenApiSchemaProperty,
	OpenApiSchemaType,
} from './openapi-types.js';

function normalizeProperty(property: OpenApiSchemaProperty) {
	const type = property?.type;
	const normalizedType = Array.isArray(type)
		? type.find((value) => value !== 'null')
		: type;
	const nullable = Array.isArray(type) ? type.includes('null') : false;

	return {
		type: normalizedType,
		...(nullable && { nullable: true }),
	};
}

export function ApiBodyParams(input: OpenApiObjectSchema) {
	const keys = Object.keys(input?.properties ?? {});
	const requiredKeys = input?.required ?? [];

	const properties: Record<string, unknown> = {};
	const required: string[] = [];

	for (const key of keys) {
		const property = input?.properties?.[key];

		if (property === undefined || typeof property === 'boolean') {
			throw new Error('Boolean properties are not supported');
		}

		const defaultValue = property?.default;
		const hasDefaultValue = defaultValue !== undefined;
		const isRequired = requiredKeys.includes(key) && !hasDefaultValue;

		properties[key] = {
			...property,
			...normalizeProperty(property),
		};

		if (isRequired) {
			required.push(key);
		}
	}

	const type = input?.type;
	const normalizedType = Array.isArray(type)
		? type.find((value) => value !== 'null')
		: type;
	const nullable = Array.isArray(type) ? type.includes('null') : false;

	const options = {
		schema: {
			...input,
			type: normalizedType as OpenApiSchemaType | undefined,
			...(nullable && { nullable: true }),
			...(Object.keys(properties).length > 0 ? { properties } : {}),
			...(required.length > 0 ? { required } : {}),
		},
	};

	return ApiBody(options as never);
}
