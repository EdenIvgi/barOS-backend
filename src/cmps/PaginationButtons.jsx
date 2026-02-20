import { useTranslation } from 'react-i18next'

export function PaginationButtons({ pageIdx, onChangePageIdx }) {
  const { t } = useTranslation()
  return (
    <div className="pagination">
      <button onClick={() => onChangePageIdx(-1)} disabled={pageIdx === 0}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {t('paginationPrev')}
      </button>
      <span>{pageIdx + 1}</span>
      <button onClick={() => onChangePageIdx(1)}>
        {t('paginationNext')}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
