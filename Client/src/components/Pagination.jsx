import { TablePagination } from '@mui/material'

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

export default function PagedControls({ total, page, rowsPerPage, onPageChange, onRowsPerPageChange }) {
  return (
    <TablePagination
      component="div"
      count={total}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={(_, next) => onPageChange(next)}
      onRowsPerPageChange={(e) => onRowsPerPageChange(Number(e.target.value))}
      rowsPerPageOptions={PAGE_SIZE_OPTIONS}
      labelRowsPerPage="Rows:"
    />
  )
}
