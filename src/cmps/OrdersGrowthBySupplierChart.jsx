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
import { useTranslation } from 'react-i18next'
import { Bar } from 'react-chartjs-2'
import { NO_SUPPLIER_KEY } from '../services/constants'

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

// Dark-mode chart theme — module-level constants (stable references for useMemo)
const CHART_FONT    = "'Inter', 'Gisha', 'Arial', sans-serif"
const C_TEXT        = 'rgba(255, 255, 255, 0.85)'
const C_MUTED       = 'rgba(255, 255, 255, 0.45)'
const C_GRID        = 'rgba(255, 255, 255, 0.07)'
const C_TOOLTIP_BG  = 'rgba(18, 18, 18, 0.97)'
const C_TOOLTIP_BD  = 'rgba(255, 255, 255, 0.12)'

const EMPTY_SUPPLIER_LABEL = NO_SUPPLIER_KEY

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
  const { t } = useTranslation()
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
          padding: 14,
          color: C_TEXT,
          font: { size: 11, weight: '600', family: CHART_FONT },
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: t('chartTitle'),
        color: C_TEXT,
        font: { size: 14, weight: '600', family: CHART_FONT },
        padding: { bottom: 14 },
      },
      tooltip: {
        backgroundColor: C_TOOLTIP_BG,
        borderColor: C_TOOLTIP_BD,
        borderWidth: 1,
        padding: 10,
        titleColor: C_TEXT,
        bodyColor: C_MUTED,
        titleFont: { size: 11, family: CHART_FONT },
        bodyFont: { size: 12, family: CHART_FONT },
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw} ${t('chartItemsSuffix')}`,
        },
      },
    },
    scales: {
      y: {
        position: 'left',
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: C_MUTED,
          font: { size: 10, family: CHART_FONT },
        },
        title: {
          display: true,
          text: t('chartItemsAxis'),
          color: C_MUTED,
          font: { size: 11, weight: '600', family: CHART_FONT },
        },
        grid: { color: C_GRID },
        border: { display: false },
      },
      x: {
        position: 'bottom',
        reverse: false,
        title: {
          display: true,
          text: t('chartDateAxis'),
          color: C_MUTED,
          font: { size: 11, weight: '600', family: CHART_FONT },
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          color: C_MUTED,
          font: { size: 10, family: CHART_FONT },
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
  }), [t])

  if (!chartData.labels.length) {
    return (
      <div className="orders-growth-chart empty">
        <h2>{t('chartTitle')}</h2>
        <p>{t('noOrderDataYet')}</p>
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
