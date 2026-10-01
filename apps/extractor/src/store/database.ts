import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { MIGRATION_0001 } from './migrations/0001_initial';

/**
 * Thin wrapper over Node's built-in SQLite (no native build step — matters on
 * locked-down NHS Windows images). Callers depend on `ExtractorDatabase`, not
 * on `node:sqlite`, so better-sqlite3 can be swapped in if `node:sqlite`
 * (experimental in Node 22) changes.
 */

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

/** Append-only. Never edit or reorder an entry once released. */
export const MIGRATIONS: readonly Migration[] = [{ version: 1, name: 'initial_schema', sql: MIGRATION_0001 }];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

function checksum(sql: string): string {
  return createHash('sha256').update(sql, 'utf8').digest('hex');
}

export class ExtractorDatabase {
  readonly db: DatabaseSync;

  private constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA foreign_keys = ON;');
    if (path !== ':memory:') {
      // WAL + FULL sync: a crash or power loss mid-capture must not corrupt evidence already written.
      this.db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
    }
  }

  static open(path: string): ExtractorDatabase {
    const store = new ExtractorDatabase(path);
    store.migrate();
    return store;
  }

  /**
   * Applies pending migrations in order, each in its own transaction, and
   * refuses to start if an already-applied migration's SQL has changed —
   * a silently edited migration means the on-disk schema no longer matches
   * what the code believes it is.
   */
  migrate(): void {
    this.db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );`);
    const applied = new Map<number, string>();
    for (const row of this.db.prepare('SELECT version, checksum FROM schema_migrations').all() as Array<{ version: number; checksum: string }>) {
      applied.set(Number(row.version), String(row.checksum));
    }
    for (const version of applied.keys()) {
      if (!MIGRATIONS.some((m) => m.version === version)) {
        throw new Error(`Database schema version ${version} is newer than this build supports (max ${SCHEMA_VERSION}). Refusing to open.`);
      }
    }
    for (const migration of MIGRATIONS) {
      const sum = checksum(migration.sql);
      const existing = applied.get(migration.version);
      if (existing !== undefined) {
        if (existing !== sum) {
          throw new Error(`Migration ${migration.version} (${migration.name}) has been modified after it was applied. Refusing to open.`);
        }
        continue;
      }
      this.transaction(() => {
        this.db.exec(migration.sql);
        this.db
          .prepare('INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)')
          .run(migration.version, migration.name, sum, new Date().toISOString());
      });
    }
  }

  schemaVersion(): number {
    const row = this.db.prepare('SELECT MAX(version) AS v FROM schema_migrations').get() as { v: number | null } | undefined;
    return Number(row?.v ?? 0);
  }

  transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const result = fn();
      this.db.exec('COMMIT;');
      return result;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  close(): void {
    this.db.close();
  }
}
