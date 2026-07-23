import { contextBridge, ipcRenderer } from 'electron'

const hub = {
  // Project
  listProjects: () => ipcRenderer.invoke('project:list'),
  getProject: (id: string) => ipcRenderer.invoke('project:get', id),
  createProject: (data: { title: string; format: string; primary_language: string }) =>
    ipcRenderer.invoke('project:create', data),
  updateProject: (id: string, data: any) => ipcRenderer.invoke('project:update', id, data),

  // Unit (manuscript structure)
  listUnits: (projectId: string) => ipcRenderer.invoke('unit:list', projectId),
  getUnit: (id: string) => ipcRenderer.invoke('unit:get', id),
  getAppearances: (projectId: string, entityId: string) => ipcRenderer.invoke('unit:appearances', projectId, entityId),
  createUnit: (data: { project_id: string; parent_unit_id?: string; title?: string; order_key?: string }) =>
    ipcRenderer.invoke('unit:create', data),
  updateUnit: (id: string, data: any) => ipcRenderer.invoke('unit:update', id, data),
  deleteUnit: (id: string) => ipcRenderer.invoke('unit:delete', id),

  // Entity
  listEntities: (projectId: string) => ipcRenderer.invoke('entity:list', projectId),
  getEntity: (id: string) => ipcRenderer.invoke('entity:get', id),
  searchEntities: (projectId: string, query: string) => ipcRenderer.invoke('entity:search', projectId, query),
  createEntity: (data: { project_id: string; entity_type: string; name: string; core_fields?: any; extended_fields?: any }) =>
    ipcRenderer.invoke('entity:create', data),
  updateEntity: (id: string, data: any) => ipcRenderer.invoke('entity:update', id, data),
  softDeleteEntity: (id: string) => ipcRenderer.invoke('entity:softDelete', id),

  // Relation
  listRelations: (projectId: string) => ipcRenderer.invoke('relation:list', projectId),
  relationsByEntity: (entityId: string) => ipcRenderer.invoke('relation:byEntity', entityId),
  createRelation: (data: any) => ipcRenderer.invoke('relation:create', data),
  updateRelation: (id: string, data: any) => ipcRenderer.invoke('relation:update', id, data),
  deleteRelation: (id: string) => ipcRenderer.invoke('relation:delete', id)
}

contextBridge.exposeInMainWorld('hub', hub)

export type HubApi = typeof hub
