import { applyDecorators } from '@nestjs/common';
import { ApiQuery, ApiQueryOptions } from '@nestjs/swagger';
import { z } from 'zod/v4';

export function ApiQueryParams(input: z.core.JSONSchema.JSONSchema) {
  const keys = Object.keys(input?.properties ?? {});
  const requiredKeys = input?.required ?? [];

  const apiQueries: (MethodDecorator & ClassDecorator)[] = [];

  for (const key of keys) {
    const properties = input?.properties?.[key];

    if (typeof properties === 'boolean') {
      throw new Error('Boolean properties are not supported');
    }

    const type = properties?.type;
    const required = requiredKeys.includes(key);

    const defaultValue = properties?.default as any;
    const description = properties?.description;
    const enumValues = properties?.enum;
    const format = properties?.format;

    const obj: ApiQueryOptions = {
      name: key,
      required: defaultValue ? false : required,
      ...(description && { description }),
      schema: {
        type,
        ...(format && { format }),
        ...(enumValues && { enum: enumValues }),
        ...(defaultValue && { default: defaultValue }),
      },
    };

    apiQueries.push(ApiQuery(obj));
  }

  return applyDecorators(...apiQueries);
}
