export type OpenApiSchemaType =
	| 'string'
	| 'number'
	| 'integer'
	| 'boolean'
	| 'array'
	| 'object'
	| 'null';

export interface OpenApiSchemaProperty {
	type?: OpenApiSchemaType | OpenApiSchemaType[];
	description?: string;
	enum?: unknown[];
	format?: string;
	default?: unknown;
	[key: string]: unknown;
}

export interface OpenApiObjectSchema {
	type?: OpenApiSchemaType | OpenApiSchemaType[];
	properties?: Record<string, OpenApiSchemaProperty | boolean>;
	required?: string[];
	[key: string]: unknown;
}
