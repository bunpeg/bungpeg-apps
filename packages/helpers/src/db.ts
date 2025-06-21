import { connect } from '@planetscale/database';

const config = {
  url: process.env['DATABASE_URL'],
};

export const db = connect(config);

export function sql<T,>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
) {
  const [query, params] = sqlTemplate(strings, ...values);
  return db.execute<T>(query, params);
}

export function query(
  strings: TemplateStringsArray,
  ...values: Primitive[]
) {
  return sqlTemplate(strings, ...values);
}

export type Primitive = string | number | boolean | Date | undefined | null;

type PlanetScaleErrorCode =
  | 'invalid_connection_string'
  | 'missing_connection_string'
  | 'invalid_connection_type'
  | 'incorrect_tagged_template_call';

export class PlanetScaleError extends Error {
  public constructor(
    public code: PlanetScaleErrorCode,
    message: string,
  ) {
    super(`PlanetScaleError - '${code}': ${message}`);
    this.name = 'PlanetScaleError';
  }
}

function sqlTemplate(
  strings: TemplateStringsArray,
  ...values: Primitive[]
): [string, Primitive[]] {
  if (!isTemplateStringsArray(strings) || !Array.isArray(values)) {
    throw new PlanetScaleError(
      'incorrect_tagged_template_call',
      "It looks like you tried to call `sql` as a function. Make sure to use it as a tagged template.\n\tExample: sql`SELECT * FROM users`, not sql('SELECT * FROM users')",
    );
  }

  let result = strings[0] ?? '';

  for (let i = 1; i < strings.length; i++) {
    result += `?${strings[i] ?? ''}`;
  }

  return [result, values];
}

function isTemplateStringsArray(
  strings: unknown,
): strings is TemplateStringsArray {
  return (
    Array.isArray(strings) && 'raw' in strings && Array.isArray(strings.raw)
  );
}
