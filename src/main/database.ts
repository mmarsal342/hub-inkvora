import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function initDb(): Database.Database {
  const dbPath = join(app.getPath('userData'), 'inkvora-hub.sqlite')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate()
  return db
}

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS project (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      format TEXT NOT NULL DEFAULT 'novel',
      primary_language TEXT NOT NULL DEFAULT 'id',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'synced',
      updated_at TEXT,
      device_id TEXT
    );

    CREATE TABLE IF NOT EXISTS unit (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      parent_unit_id TEXT REFERENCES unit(id) ON DELETE SET NULL,
      order_key TEXT NOT NULL DEFAULT '0',
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '{}',
      sync_status TEXT DEFAULT 'synced',
      updated_at TEXT,
      device_id TEXT
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('character','location','faction','item','lore','timeline_event')),
      name TEXT NOT NULL DEFAULT '',
      core_fields TEXT NOT NULL DEFAULT '{}',
      extended_fields TEXT NOT NULL DEFAULT '{}',
      deleted_at TEXT,
      merged_into TEXT REFERENCES entities(id),
      sync_status TEXT DEFAULT 'synced',
      updated_at TEXT,
      device_id TEXT
    );

    CREATE TABLE IF NOT EXISTS project_entities (
      project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, entity_id)
    );

    CREATE TABLE IF NOT EXISTS relation (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      from_entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      to_entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      relation_type TEXT NOT NULL DEFAULT '',
      direction TEXT NOT NULL DEFAULT 'symmetric' CHECK(direction IN ('symmetric','directional')),
      valence INTEGER NOT NULL DEFAULT 0,
      intensity INTEGER NOT NULL DEFAULT 0,
      current_type TEXT NOT NULL DEFAULT '',
      history TEXT NOT NULL DEFAULT '[]',
      sync_status TEXT DEFAULT 'synced',
      updated_at TEXT,
      device_id TEXT
    );

    CREATE TABLE IF NOT EXISTS event (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      sort_key REAL NOT NULL DEFAULT 0,
      precision TEXT NOT NULL DEFAULT 'day',
      display_label TEXT NOT NULL DEFAULT '',
      relative_to TEXT,
      sync_status TEXT DEFAULT 'synced',
      updated_at TEXT,
      device_id TEXT
    );

    CREATE TABLE IF NOT EXISTS event_participants (
      event_id TEXT NOT NULL REFERENCES event(id) ON DELETE CASCADE,
      entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'participant',
      sync_status TEXT DEFAULT 'synced',
      updated_at TEXT,
      device_id TEXT,
      PRIMARY KEY (event_id, entity_id)
    );
  `)
}
