import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Star } from 'lucide-react';
import { DataTable } from '@/components/data-table/DataTable';
import { Badge } from '@/components/ui/badge';
import { useRatings, useRatingsDashboard } from '@/features/ratings/useRatings';
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
  const { data: dashboard, isPending: dashboardPending } = useRatingsDashboard();

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

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Điểm trung bình</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-semibold">
              {dashboardPending ? '-' : (dashboard?.averageStars ?? 0).toFixed(1)}
            </p>
            {renderStars(Math.round(dashboard?.averageStars ?? 0))}
          </div>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Tổng feedback</p>
          <p className="mt-1 text-2xl font-semibold">{dashboardPending ? '-' : dashboard?.total ?? 0}</p>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Phân bố sao</p>
          <div className="mt-2 space-y-1">
            {(dashboard?.distribution ?? [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 }))).map((item) => (
              <div key={item.stars} className="flex items-center gap-2 text-xs">
                <span className="w-6">{item.stars}★</span>
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-amber-500"
                    style={{ width: `${dashboard?.total ? (item.count / dashboard.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Comment mới nhất</h2>
        {dashboard?.recentComments?.length ? (
          <div className="grid gap-2">
            {dashboard.recentComments.map((rating) => (
              <div key={rating._id} className="rounded-md bg-muted/40 p-3 text-sm">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="font-medium">{getUserLabel(rating.userId)}</span>
                  {renderStars(rating.stars)}
                </div>
                <p className="text-muted-foreground">{rating.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có comment.</p>
        )}
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
