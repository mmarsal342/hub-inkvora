export type ProjectFormat = 'novel' | 'cerpen' | 'cerbung' | 'webnovel' | 'flash_fiction' | 'custom'

export interface Project {
  id: string
  title: string
  format: ProjectFormat
  primary_language: string
  created_at: string
  sync_status?: 'synced' | 'dirty' | 'conflict'
  updated_at?: string
  device_id?: string
}

export interface Unit {
  id: string
  project_id: string
  parent_unit_id: string | null
  order_key: string // fractional index
  title: string
  content: string // stringified JSON
  sync_status?: 'synced' | 'dirty' | 'conflict'
  updated_at?: string
  device_id?: string
}

export type EntityType = 'character' | 'location' | 'faction' | 'item' | 'lore' | 'timeline_event'

export interface Entity {
  id: string
  entity_type: EntityType
  name: string
  core_fields: Record<string, any>
  extended_fields: Record<string, any>
  deleted_at: string | null
  merged_into: string | null
  sync_status?: 'synced' | 'dirty' | 'conflict'
  updated_at?: string
  device_id?: string
}

export interface Relation {
  id: string
  project_id: string
  from_entity_id: string
  to_entity_id: string
  relation_type: string
  direction: 'symmetric' | 'directional'
  valence: number // -100 to 100
  intensity: number // 0 to 100
  current_type: string
  history: Array<{
    from_type: string
    to_type: string
    story_time: string
    event_id: string | null
    note: string
  }>
  sync_status?: 'synced' | 'dirty' | 'conflict'
  updated_at?: string
  device_id?: string
}

export interface EventParticipant {
  event_id: string
  entity_id: string
  role: string
  sync_status?: 'synced' | 'dirty' | 'conflict'
  updated_at?: string
  device_id?: string
}

export interface Event {
  id: string
  project_id: string
  sort_key: number
  precision: 'era' | 'century' | 'decade' | 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'
  display_label: string
  relative_to: {
    event_id: string
    relation: 'before' | 'after' | 'same_time'
  } | null
  sync_status?: 'synced' | 'dirty' | 'conflict'
  updated_at?: string
  device_id?: string
}
