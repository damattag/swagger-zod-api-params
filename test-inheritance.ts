import { z } from 'zod';
import { createZodDto } from './src/create-zod-dto';

const schema = z.object({ name: z.string() });
class Base extends createZodDto(schema) {}
class Sub extends Base {}

console.log('Base schema:', !!(Base as any).schema);
console.log('Sub schema:', !!(Sub as any).schema);
