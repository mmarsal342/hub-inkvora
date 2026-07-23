import { ipcMain } from 'electron'
import { getDb } from './database'
import { v4 as uuid } from 'uuid'

function now() {
  return new Date().toISOString()
}

export function registerIpcHandlers() {
  // ── Project ───────────────────────────────────────────
  ipcMain.handle('project:list', () => {
    return getDb().prepare('SELECT * FROM project ORDER BY updated_at DESC').all()
  })

  ipcMain.handle('project:get', (_e, id: string) => {
    return getDb().prepare('SELECT * FROM project WHERE id = ?').get(id)
  })

  ipcMain.handle('project:create', (_e, data: { title: string; format: string; primary_language: string }) => {
    const id = uuid()
    const ts = now()
    getDb().prepare(
      'INSERT INTO project (id, title, format, primary_language, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, data.title, data.format || 'novel', data.primary_language || 'id', ts, ts)
    return getDb().prepare('SELECT * FROM project WHERE id = ?').get(id)
  })

  ipcMain.handle('project:update', (_e, id: string, data: Partial<{ title: string; format: string; primary_language: string }>) => {
    const fields: string[] = []
    const vals: any[] = []
    for (const [k, v] of Object.entries(data)) {
      fields.push(`${k} = ?`)
      vals.push(v)
    }
    vals.push(id)
    getDb().prepare(`UPDATE project SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`).run(now(), ...vals)
    return getDb().prepare('SELECT * FROM project WHERE id = ?').get(id)
  })

  // ── Unit ──────────────────────────────────────────────
  ipcMain.handle('unit:list', (_e, projectId: string) => {
    return getDb().prepare('SELECT * FROM unit WHERE project_id = ? ORDER BY order_key ASC').all(projectId)
  })

  ipcMain.handle('unit:get', (_e, id: string) => {
    return getDb().prepare('SELECT * FROM unit WHERE id = ?').get(id)
  })

  ipcMain.handle('unit:create', (_e, data: { project_id: string; parent_unit_id?: string; title?: string; order_key?: string }) => {
    const id = uuid()
    const ts = now()
    getDb().prepare(
      'INSERT INTO unit (id, project_id, parent_unit_id, order_key, title, content, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, data.project_id, data.parent_unit_id || null, data.order_key || '1000', data.title || 'New Scene', '{}', ts)
    return getDb().prepare('SELECT * FROM unit WHERE id = ?').get(id)
  })

  ipcMain.handle('unit:update', (_e, id: string, data: Partial<{ title: string; content: string; order_key: string; parent_unit_id: string | null }>) => {
    const fields: string[] = []
    const vals: any[] = []
    for (const [k, v] of Object.entries(data)) {
      fields.push(`${k} = ?`)
      vals.push(v)
    }
    vals.push(id)
    getDb().prepare(`UPDATE unit SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`).run(now(), ...vals)
    return getDb().prepare('SELECT * FROM unit WHERE id = ?').get(id)
  })

  ipcMain.handle('unit:delete', (_e, id: string) => {
    getDb().prepare('DELETE FROM unit WHERE id = ?').run(id)
    return true
  })

  // ── Entity ────────────────────────────────────────────
  ipcMain.handle('entity:list', (_e, projectId: string) => {
    return getDb().prepare(
      'SELECT e.* FROM entities e JOIN project_entities pe ON e.id = pe.entity_id WHERE pe.project_id = ? AND e.deleted_at IS NULL ORDER BY e.name ASC'
    ).all(projectId)
  })

  ipcMain.handle('entity:get', (_e, id: string) => {
    return getDb().prepare('SELECT * FROM entities WHERE id = ?').get(id)
  })

  ipcMain.handle('entity:create', (_e, data: { project_id: string; entity_type: string; name: string; core_fields?: any; extended_fields?: any }) => {
    const id = uuid()
    const ts = now()
    getDb().prepare(
      'INSERT INTO entities (id, entity_type, name, core_fields, extended_fields, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, data.entity_type, data.name, JSON.stringify(data.core_fields || {}), JSON.stringify(data.extended_fields || {}), ts)
    getDb().prepare('INSERT INTO project_entities (project_id, entity_id) VALUES (?, ?)').run(data.project_id, id)
    return getDb().prepare('SELECT * FROM entities WHERE id = ?').get(id)
  })

  ipcMain.handle('entity:update', (_e, id: string, data: Partial<{ name: string; core_fields: any; extended_fields: any }>) => {
    const fields: string[] = []
    const vals: any[] = []
    for (const [k, v] of Object.entries(data)) {
      if (k === 'core_fields' || k === 'extended_fields') {
        fields.push(`${k} = ?`)
        vals.push(JSON.stringify(v))
      } else {
        fields.push(`${k} = ?`)
        vals.push(v)
      }
    }
    vals.push(id)
    getDb().prepare(`UPDATE entities SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`).run(now(), ...vals)
    return getDb().prepare('SELECT * FROM entities WHERE id = ?').get(id)
  })

  ipcMain.handle('entity:softDelete', (_e, id: string) => {
    const ts = now()
    getDb().prepare('UPDATE entities SET deleted_at = ?, updated_at = ? WHERE id = ?').run(ts, ts, id)
    return true
  })

  // ── Relation ──────────────────────────────────────────
  ipcMain.handle('relation:list', (_e, projectId: string) => {
    return getDb().prepare('SELECT * FROM relation WHERE project_id = ?').all(projectId)
  })

  ipcMain.handle('relation:create', (_e, data: {
    project_id: string; from_entity_id: string; to_entity_id: string;
    relation_type: string; direction: string; valence: number; intensity: number
  }) => {
    const id = uuid()
    const ts = now()
    getDb().prepare(
      `INSERT INTO relation (id, project_id, from_entity_id, to_entity_id, relation_type, direction, valence, intensity, current_type, history, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.project_id, data.from_entity_id, data.to_entity_id, data.relation_type,
      data.direction, data.valence, data.intensity, data.relation_type, '[]', ts)
    return getDb().prepare('SELECT * FROM relation WHERE id = ?').get(id)
  })
}
