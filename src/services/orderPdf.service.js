import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * מייצר PDF להזמנה ע"י רינדור HTML (תמיכה מלאה בעברית) והדבקה כתמונה.
 * מציג: ספק, תאריך, רשימת פריטים (שם מוצר + כמות) – בלי מחירים.
 * @param {Object} order - אובייקט ההזמנה
 * @param {string} [fileName] - שם קובץ (ללא .pdf)
 * @param {string} [supplierName] - שם הספק (למשל מהעמודה בטבלה). אם לא מועבר – משתמשים ב-order.supplier
 */
export async function downloadOrderPdf(order, fileName, supplierName) {
  if (!order) return

  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''
  const supplierStr =
    supplierName != null && String(supplierName).trim() !== ''
      ? String(supplierName).trim()
      : order.supplier != null && String(order.supplier).trim() !== ''
        ? String(order.supplier).trim()
        : 'ללא ספק'
  const items = order.items || []

  const div = document.createElement('div')
  div.setAttribute('dir', 'rtl')
  div.style.cssText = [
    'position:fixed; left:-9999px; top:0;',
    'width:600px; padding:24px; box-sizing:border-box;',
    'font-family: Arial, "David", "Heebo", sans-serif; font-size: 16px;',
    'color:#1a1a1a; background:#fff; line-height:1.5;'
  ].join(' ')

  div.innerHTML = [
    '<h1 style="margin:0 0 16px; font-size:24px; border-bottom:2px solid #333; padding-bottom:8px;">הזמנה</h1>',
    '<p style="margin:0 0 8px;"><strong>תאריך:</strong> ' + escapeHtml(dateStr) + '</p>',
    '<p style="margin:0 0 20px;"><strong>ספק:</strong> ' + escapeHtml(supplierStr) + '</p>',
    items.length
      ? '<table style="width:100%; border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #333;">' +
      '<th style="text-align:right; padding:8px 12px;">שם מוצר</th>' +
      '<th style="text-align:center; padding:8px 12px; width:80px;">כמות</th></tr></thead>' +
      '<tbody>' +
      items
        .map(
          (item) =>
            '<tr style="border-bottom:1px solid #ddd">' +
            '<td style="text-align:right; padding:8px 12px;">' +
            escapeHtml(String(item.name || '').trim() || '—') +
            '</td>' +
            '<td style="text-align:center; padding:8px 12px;">' +
            (item.quantity ?? 0) +
            '</td></tr>'
        )
        .join('') +
      '</tbody></table>'
      : '<p>אין פריטים</p>'
  ].join('')

  document.body.appendChild(div)

  try {
    const canvas = await html2canvas(div, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })
    document.body.removeChild(div)

    const imgW = canvas.width
    const imgH = canvas.height
    const a4W = 210
    const a4H = 297
    let w = a4W
    let h = (imgH * a4W) / imgW
    if (h > a4H) {
      h = a4H
      w = (imgW * a4H) / imgH
    }
    const x = (a4W - w) / 2

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, 10, w, h)

    const name = fileName || `order-${order._id || Date.now()}.pdf`
    doc.save(name.endsWith('.pdf') ? name : name + '.pdf')
  } catch (e) {
    document.body.removeChild(div)
    throw e
  }
}

function escapeHtml(str) {
  const span = document.createElement('span')
  span.textContent = str
  return span.innerHTML
}
