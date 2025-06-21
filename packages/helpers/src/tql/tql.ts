import { init  } from '@sejohnson/tql';

import { IdenticalColumnValidator } from './values-object-validator';
import type { DialectImpl } from './types';
import { BaseDialect } from './dialect';
import {
  type TqlIdentifiers,
  type TqlList,
  type TqlParameter,
  type TqlTemplateString,
  type TqlSet,
  type TqlValues,
} from './nodes';

class MySQLDialect extends BaseDialect implements DialectImpl {
  templateString(str: TqlTemplateString): void {
    this.appendToQuery(str.value);
  }

  parameter(param: TqlParameter): void {
    this.appendToParams(param.value);
    this.appendToQuery(`?`);
  }

  identifiers(ids: TqlIdentifiers): void {
    if (Array.isArray(ids.values)) {
      this.appendToQuery(ids.values.join(', '));
    } else {
      this.appendToQuery(ids.values);
    }
  }

  list(vals: TqlList): void {
    this.appendToQuery('(');
    const queryItems: string[] = [];
    for (const param of vals.values) {
      this.appendToParams(param);
      queryItems.push('?');
    }
    this.appendToQuery(queryItems.join(', '));
    this.appendToQuery(')');
  }

  values(entries: TqlValues): void {
    if (Array.isArray(entries.values)) {
      // it's multiple entries
      const validator = new IdenticalColumnValidator();
      let first = true;
      let columns: string[] = [];
      const rows: string[] = [];
      for (const entry of entries.values) {
        validator.validate(entry);
        if (first) {
          first = false;
          columns = Object.keys(entry);
          this.appendToQuery(`(${columns.join(', ')}) VALUES `);
        }
        const queryItems: string[] = [];
        for (const column of columns) {
          this.appendToParams(entry[column]);
          queryItems.push('?');
        }
        rows.push(`(${queryItems.join(', ')})`);
      }
      this.appendToQuery(rows.join(', '));
    } else {
      // it's a single entry
      const entry = entries.values;
      const columns = Object.keys(entry);
      this.appendToQuery(`(${columns.join(', ')}) VALUES `);
      const queryItems: string[] = [];
      for (const column of columns) {
        this.appendToParams(entry[column]);
        queryItems.push('?');
      }
      this.appendToQuery(`(${queryItems.join(', ')})`);
    }
  }

  set(entry: TqlSet): void {
    this.appendToQuery('SET ');
    const columns = Object.keys(entry.values);
    const queryItems: string[] = [];
    for (const column of columns) {
      this.appendToParams(entry.values[column]);
      queryItems.push(`${column} = ?`);
    }
    this.appendToQuery(queryItems.join(', '));
  }

  private static escapeIdentifier(value: string): string {
    return `"${value.replace(/"/g, '""').replace(/\./g, '"."')}"`;
  }
}

export const tql = init({ dialect: MySQLDialect });
