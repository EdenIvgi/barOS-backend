import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// Distinct colors per supplier
const SUPPLIER_COLORS = [
  { main: 'rgb(15, 118, 110)', fill: 'rgba(15, 118, 110, 0.85)' },   // teal
  { main: 'rgb(217, 119, 6)', fill: 'rgba(217, 119, 6, 0.85)' },     // amber
  { main: 'rgb(37, 99, 235)', fill: 'rgba(37, 99, 235, 0.85)' },     // blue
  { main: 'rgb(194, 65, 12)', fill: 'rgba(194, 65, 12, 0.85)' },     // orange
  { main: 'rgb(107, 33, 168)', fill: 'rgba(107, 33, 168, 0.85)' },   // violet
  { main: 'rgb(16, 185, 129)', fill: 'rgba(16, 185, 129, 0.85)' },   // emerald
  { main: 'rgb(220, 38, 38)', fill: 'rgba(220, 38, 38, 0.85)' },     // red
  { main: 'rgb(20, 184, 166)', fill: 'rgba(20, 184, 166, 0.85)' },   // cyan
]

const EMPTY_SUPPLIER_LABEL = 'ללא ספק'

function getDateKey(ts) {
  if (!ts) return null
  const d = new Date(ts)
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function getDisplayDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Same logic as OrdersListPage: use order.supplier, or derive from first item's supplier in inventory.
 * Ensures one consistent key per logical supplier so each supplier gets its own line.
 */
function getOrderSupplier(order, inventoryItems = []) {
  if (!order) return EMPTY_SUPPLIER_LABEL
  const fromOrder = order.supplier
  if (fromOrder != null && String(fromOrder).trim() !== '') {
    return String(fromOrder).trim()
  }
  if (!order.items?.length || !inventoryItems?.length) return EMPTY_SUPPLIER_LABEL
  for (const orderItem of order.items) {
    const itemId = orderItem.itemId ?? orderItem._id
    if (!itemId) continue
    const inv = inventoryItems.find(
      (i) => String(i._id) === String(itemId) || i._id?.toString() === String(itemId)
    )
    const s = inv?.supplier ?? inv?.supplierName
    if (s != null && String(s).trim() !== '') return String(s).trim()
  }
  return EMPTY_SUPPLIER_LABEL
}

/**
 * כמות הפריטים בהזמנה – כמו במסך ההזמנות: מספר הפריטים (שורות) בהזמנה = order.items.length
 */
function getOrderItemsCount(order) {
  return order?.items?.length || 0
}

const MIN_DAYS_TO_SHOW = 10

/**
 * Build chart data: orders grouped by date and supplier.
 * מציג מינימום 10 ימים (אם יש פחות תאריכים – מרחיבים את הטווח לאחור).
 * Y-axis = כמות הפריטים שהוזמנה מכל ספק – כמו במסך ההזמנות.
 */
function buildChartData(orders, inventoryItems = []) {
  if (!orders || orders.length === 0) {
    return { labels: [], datasets: [], barCount: 0 }
  }

  const dateQuantityBySupplier = {} // { supplier: { dateKey: sumQuantity } }
  const dateSet = new Set()

  for (const order of orders) {
    const dateKey = getDateKey(order.createdAt)
    if (!dateKey) continue
    const supplier = getOrderSupplier(order, inventoryItems)
    const count = getOrderItemsCount(order)

    dateSet.add(dateKey)
    if (!dateQuantityBySupplier[supplier]) {
      dateQuantityBySupplier[supplier] = {}
    }
    dateQuantityBySupplier[supplier][dateKey] =
      (dateQuantityBySupplier[supplier][dateKey] || 0) + count
  }

  let sortedDates = Array.from(dateSet).sort()
  // Minimum 10 days: if fewer, extend backwards
  if (sortedDates.length < MIN_DAYS_TO_SHOW) {
    const lastDate = new Date(sortedDates[sortedDates.length - 1] + 'T12:00:00')
    const dayMs = 24 * 60 * 60 * 1000
    const extended = []
    for (let i = MIN_DAYS_TO_SHOW - 1; i >= 0; i--) {
      const d = new Date(lastDate.getTime() - i * dayMs)
      extended.push(d.toISOString().slice(0, 10))
    }
    sortedDates = extended
  }

  // Order: oldest date first (left), newest last (right)
  const labels = sortedDates.map(d => getDisplayDate(d + 'T12:00:00'))
  const suppliers = Object.keys(dateQuantityBySupplier).sort()
  const datasets = suppliers.map((supplier, idx) => {
    const { main, fill } = SUPPLIER_COLORS[idx % SUPPLIER_COLORS.length]
    return {
      label: supplier,
      data: sortedDates.map(dateKey => dateQuantityBySupplier[supplier][dateKey] || 0),
      backgroundColor: fill,
      borderColor: main,
      borderWidth: 0,
      borderRadius: 0,
    }
  })

  return { labels, datasets, barCount: sortedDates.length }
}

const PX_PER_DAY = 44
const CHART_HEIGHT = 320

export function OrdersGrowthBySupplierChart({ orders, items = [] }) {
  const chartData = useMemo(
    () => buildChartData(orders, items),
    [orders, items]
  )

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 8, right: 12, bottom: 28, left: 4 },
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          padding: 12,
          font: { size: 11, weight: '600' },
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'כמות הפריטים שהוזמנה מכל ספק בכל יום',
        font: { size: 15, weight: '600' },
        padding: { bottom: 14 },
      },
      tooltip: {
        backgroundColor: 'rgba(40, 40, 40, 0.95)',
        padding: 8,
        titleFont: { size: 11 },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw} פריטים`,
        },
      },
    },
    scales: {
      y: {
        position: 'left',
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 10 },
        },
        title: {
          display: true,
          text: 'כמות פריטים',
          font: { size: 11, weight: '600' },
        },
        grid: { color: 'rgba(0, 0, 0, 0.08)' },
        border: { display: false },
      },
      x: {
        position: 'bottom',
        reverse: false,
        title: {
          display: true,
          text: 'תאריך',
          font: { size: 11, weight: '600' },
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          font: { size: 10 },
        },
        grid: { display: false },
        border: { display: false },
      },
    },
    datasets: {
      bar: {
        barPercentage: 1,
        categoryPercentage: 0.78,
      },
    },
  }), [])

  if (!chartData.labels.length) {
    return (
      <div className="orders-growth-chart empty">
        <h2>צמיחה בהזמנות לפי ספק</h2>
        <p>אין עדיין נתוני הזמנות להצגה.</p>
      </div>
    )
  }

  const minWidth = chartData.barCount * PX_PER_DAY

  return (
    <div className="orders-growth-chart" dir="ltr" style={{ direction: 'ltr' }}>
      <div
        className="chart-container"
        style={{
          height: CHART_HEIGHT,
          width: '100%',
          minWidth: minWidth,
          direction: 'ltr',
        }}
      >
        <Bar options={options} data={chartData} />
      </div>
    </div>
  )
}
