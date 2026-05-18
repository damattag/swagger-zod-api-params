import { applyDecorators } from '@nestjs/common';
import { ApiParam, type ApiParamOptions } from '@nestjs/swagger';
import type { OpenApiObjectSchema } from './openapi-types.js';

export function ApiPathParams(input: OpenApiObjectSchema) {
	const keys = Object.keys(input?.properties ?? {});
	const requiredKeys = input?.required ?? [];

	const apiParams: (MethodDecorator & ClassDecorator)[] = [];

	for (const key of keys) {
		const properties = input?.properties?.[key];

		if (typeof properties === 'boolean') {
			throw new Error('Boolean properties are not supported');
		}

		const type = properties?.type;
		const normalizedType = Array.isArray(type)
			? type.find((value) => value !== 'null')
			: type;
		const nullable = Array.isArray(type) ? type.includes('null') : false;
		const required = requiredKeys.includes(key);

		const description = properties?.description;
		const enumValues = properties?.enum;
		const format = properties?.format;

		const obj: ApiParamOptions = {
			name: key,
			required,
			...(description && { description }),
			schema: {
				type: normalizedType,
				...(nullable && { nullable: true }),
				...(format && { format }),
				...(enumValues && { enum: enumValues }),
			},
		};

		apiParams.push(ApiParam(obj));
	}

	return applyDecorators(...apiParams);
}
