import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// --- Table metadata (for wizard) ---

export async function fetchTables() {
  const { data } = await api.get('/qb/tables')
  return data
}

export async function fetchTableFields(tableId) {
  const { data } = await api.get(`/qb/tables/${tableId}/fields`)
  return data
}

// --- Technicians ---

export async function fetchTechnicians() {
  const { data } = await api.get('/qb/technicians')
  return data
}

// --- Work Orders ---

export async function fetchWorkOrders(filters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.assigned !== undefined) params.set('assigned', String(filters.assigned))
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)

  const { data } = await api.get(`/qb/work-orders?${params}`)
  return data
}

export async function updateWorkOrder(recordId, updates) {
  const { data } = await api.put(`/qb/work-orders/${recordId}`, updates)
  return data
}

export async function batchUpdateWorkOrders(updates) {
  const { data } = await api.put('/qb/work-orders/batch', { updates })
  return data
}

// --- Availability ---

export async function fetchAvailability(filters = {}) {
  const params = new URLSearchParams()
  if (filters.technicianId) params.set('technicianId', String(filters.technicianId))
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)

  const { data } = await api.get(`/qb/availability?${params}`)
  return data
}

export async function createAvailability(eventData) {
  const { data } = await api.post('/qb/availability', eventData)
  return data
}

export async function updateAvailability(recordId, updates) {
  const { data } = await api.put(`/qb/availability/${recordId}`, updates)
  return data
}

export async function deleteAvailability(recordId) {
  const { data } = await api.delete(`/qb/availability/${recordId}`)
  return data
}

export async function bulkCreateAvailability(events) {
  const { data } = await api.post('/qb/availability/bulk', { events })
  return data
}

// --- AI Suggestions ---

export async function suggestTables() {
  const { data } = await api.post('/ai/suggest-tables')
  return data
}

export async function suggestFieldMappings(tableId, role) {
  const { data } = await api.post('/ai/suggest-mappings', { tableId, role })
  return data
}
