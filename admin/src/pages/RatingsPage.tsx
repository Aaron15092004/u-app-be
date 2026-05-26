import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Star } from 'lucide-react';
import { DataTable } from '@/components/data-table/DataTable';
import { Badge } from '@/components/ui/badge';
import { useRatings } from '@/features/ratings/useRatings';
import type { AdminV2AppRating } from '@/features/v2-contracts/types';

function renderStars(stars: number) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500" aria-label={`${stars} sao`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={`h-4 w-4 ${index < stars ? 'fill-current' : 'opacity-25'}`} />
      ))}
    </div>
  );
}

function getUserLabel(userId: AdminV2AppRating['userId']) {
  if (typeof userId === 'string') return userId;
  return userId.email ?? userId.name ?? userId._id;
}

export function RatingsPage() {
  const [page, setPage] = useState(1);
  const { data, isPending } = useRatings(page);

  const columns: ColumnDef<AdminV2AppRating>[] = [
    {
      accessorKey: 'userId',
      header: 'Người dùng',
      cell: ({ row }) => <span className="font-medium">{getUserLabel(row.original.userId)}</span>,
    },
    {
      accessorKey: 'stars',
      header: 'Sao',
      cell: ({ row }) => renderStars(row.original.stars),
    },
    {
      accessorKey: 'comment',
      header: 'Comment',
      cell: ({ row }) => (
        <p className="max-w-xl whitespace-pre-wrap text-sm">
          {row.original.comment || <span className="text-muted-foreground">Không có</span>}
        </p>
      ),
    },
    {
      accessorKey: 'trigger',
      header: 'Trigger',
      cell: ({ row }) => <Badge variant="secondary">{row.original.trigger}</Badge>,
    },
    {
      accessorKey: 'platform',
      header: 'Nền tảng',
      cell: ({ row }) => row.original.platform,
    },
    {
      accessorKey: 'appVersion',
      header: 'Version',
      cell: ({ row }) => row.original.appVersion ?? '-',
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('vi-VN'),
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Đánh giá app</h1>
        <p className="text-muted-foreground text-sm">
          {data ? `${data.total} đánh giá nội bộ` : 'Đang tải...'}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isPending}
        serverPagination={{ page, totalPages: data?.totalPages ?? 1, onPageChange: setPage }}
      />
    </div>
  );
}
