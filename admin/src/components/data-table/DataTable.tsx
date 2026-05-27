import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ServerPagination {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  isLoading?: boolean;
  serverPagination?: ServerPagination;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 20,
  isLoading = false,
  serverPagination,
}: DataTableProps<TData, TValue>) {
  const isServer = Boolean(serverPagination);

  const table = useReactTable({
    data,
    columns,
    initialState: { pagination: { pageSize } },
    manualPagination: isServer,
    pageCount: isServer ? serverPagination!.totalPages : undefined,
    getCoreRowModel: getCoreRowModel(),
    ...(isServer ? {} : { getPaginationRowModel: getPaginationRowModel() }),
  });

  const currentPage = isServer ? serverPagination!.page : table.getState().pagination.pageIndex + 1;
  const totalPages = isServer ? serverPagination!.totalPages : Math.max(1, table.getPageCount());
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  function handlePrev() {
    if (isServer) serverPagination!.onPageChange(currentPage - 1);
    else table.previousPage();
  }

  function handleNext() {
    if (isServer) serverPagination!.onPageChange(currentPage + 1);
    else table.nextPage();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Không có dữ liệu.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">
          Trang {currentPage} / {totalPages}
        </span>
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={!canPrev || isLoading}>
          Trước
        </Button>
        <Button variant="outline" size="sm" onClick={handleNext} disabled={!canNext || isLoading}>
          Sau
        </Button>
      </div>
    </div>
  );
}
