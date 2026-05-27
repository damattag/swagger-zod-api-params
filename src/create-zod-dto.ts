import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type ZodType, z } from 'zod';
import type {
	OpenApiObjectSchema,
	OpenApiSchemaProperty,
	OpenApiSchemaType,
} from './openapi-types.js';

type ApiPropertyType =
	| 'string'
	| 'number'
	| 'integer'
	| 'boolean'
	| 'array'
	| 'object';

function mapSchemaTypeToSwaggerType(
	type: OpenApiSchemaType | undefined,
): ApiPropertyType | undefined {
	if (!type || type === 'null') return undefined;
	return type as ApiPropertyType;
}

function resolveAnyOf(property: OpenApiSchemaProperty): OpenApiSchemaProperty {
	const anyOf = property?.anyOf as
		| Array<{ type?: string; [key: string]: unknown }>
		| undefined;

	if (!Array.isArray(anyOf)) return property;

	const nonNullSchema = anyOf.find((s) => s.type !== 'null');
	const hasNull = anyOf.some((s) => s.type === 'null');

	if (!nonNullSchema) return property;

	return {
		...property,
		...nonNullSchema,
		type: hasNull
			? ([nonNullSchema.type as string, 'null'] as OpenApiSchemaType[])
			: (nonNullSchema.type as OpenApiSchemaType),
		anyOf: undefined,
	};
}

function normalizeType(property: OpenApiSchemaProperty) {
	const resolved = resolveAnyOf(property);
	const type = resolved?.type;
	const normalizedType = Array.isArray(type)
		? type.find((value) => value !== 'null')
		: type;
	const nullable = Array.isArray(type) ? type.includes('null') : false;

	return { type: normalizedType, nullable };
}

function buildApiPropertyOptions(
	property: OpenApiSchemaProperty,
	isRequired: boolean,
) {
	const resolved = resolveAnyOf(property);
	const { type, nullable } = normalizeType(property);
	const swaggerType = mapSchemaTypeToSwaggerType(type);

	const options: Record<string, unknown> = {};

	if (swaggerType) {
		options.type = swaggerType;
	}

	if (resolved.description) {
		options.description = resolved.description;
	}

	if (resolved.enum) {
		options.enum = resolved.enum;
	}

	if (resolved.format) {
		options.format = resolved.format;
	}

	if (resolved.default !== undefined) {
		options.default = resolved.default;
	}

	if (nullable) {
		options.nullable = true;
	}

	options.required = isRequired;

	return options;
}

export function createZodDto<T = Record<string, unknown>>(
	schema: ZodType,
): new () => T {
	const input = z.toJSONSchema(schema) as OpenApiObjectSchema;
	const keys = Object.keys(input?.properties ?? {});
	const requiredKeys = input?.required ?? [];

	class DynamicDto {}
	Object.defineProperty(DynamicDto, 'schema', {
		value: schema,
		writable: false,
		configurable: false,
		enumerable: true,
	});

	for (const key of keys) {
		const property = input?.properties?.[key];

		if (property === undefined || typeof property === 'boolean') {
			throw new Error('Boolean properties are not supported');
		}

		const defaultValue = property?.default;
		const hasDefaultValue = defaultValue !== undefined;
		const isRequired = requiredKeys.includes(key) && !hasDefaultValue;

		const options = buildApiPropertyOptions(property, isRequired);

		const decorator = isRequired
			? ApiProperty(options as never)
			: ApiPropertyOptional(options as never);

		decorator(DynamicDto.prototype, key);

		Object.defineProperty(DynamicDto.prototype, key, {
			writable: true,
			enumerable: true,
			configurable: true,
			value: hasDefaultValue ? defaultValue : undefined,
		});
	}

	// biome-ignore lint/suspicious/noExplicitAny: it's necessary
	return DynamicDto as any;
}
