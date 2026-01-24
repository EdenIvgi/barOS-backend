export function PaginationButtons({ pageIdx, onChangePageIdx }) {
  return (
    <div className="pagination">
      <button onClick={() => onChangePageIdx(-1)} disabled={pageIdx === 0}>
        Previous
      </button>
      {pageIdx + 1}
      <button onClick={() => onChangePageIdx(1)}>Next</button>
    </div>
  )
}
