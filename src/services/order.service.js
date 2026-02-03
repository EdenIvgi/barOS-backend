import { httpService } from './http.service'

const BASE_URL = 'order/'

export const orderService = {
  query,
  getById,
  save,
  remove,
  updateStatus,
  getActiveOrders,
}

async function query(filterBy = {}) {
  return httpService.get(BASE_URL, filterBy)
}

async function getById(orderId) {
  return httpService.get(`${BASE_URL}${orderId}`)
}

async function save(order) {
  if (order._id) {
    return httpService.put(`${BASE_URL}${order._id}`, order)
  } else {
    const supplierStr = order.supplier != null ? String(order.supplier).trim() : ''
    const body = {
      items: order.items,
      userId: order.userId ?? null,
      status: order.status || 'pending',
      type: order.type || 'stock_order',
      supplier: supplierStr
    }
    const params = new URLSearchParams()
    if (supplierStr) params.set('supplier', supplierStr)
    const url = params.toString() ? `${BASE_URL}?${params.toString()}` : BASE_URL
    return httpService.post(url, body)
  }
}

async function remove(orderId) {
  return httpService.delete(`${BASE_URL}${orderId}`)
}

async function updateStatus(orderId, status) {
  return httpService.put(`${BASE_URL}${orderId}/status`, { status })
}

async function getActiveOrders() {
  return httpService.get(`${BASE_URL}active`)
}
