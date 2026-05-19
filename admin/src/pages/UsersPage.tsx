import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ShieldOff, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUsers, useBanUser, useDeleteUser, AdminUser } from '@/features/users/useUsers';
import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function UsersPage() {
  const [page] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { data, isPending } = useUsers(page, debouncedSearch);
  const banMutation = useBanUser();
  const deleteMutation = useDeleteUser();

  async function handleBan(user: AdminUser) {
    const action = user.isActive ? 'khóa' : 'mở khóa';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản ${user.email}?`)) return;
    try {
      await banMutation.mutateAsync(user._id);
      toast(`Đã ${action} tài khoản`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error ?? `Không thể ${action}`);
    }
  }

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Xóa tài khoản ${user.email}? Hành động này không thể hoàn tác.`)) return;
    try {
      await deleteMutation.mutateAsync(user._id);
      toast('Đã xóa tài khoản');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error ?? 'Không thể xóa');
    }
  }

  let searchTimer: ReturnType<typeof setTimeout>;
  function handleSearchChange(val: string) {
    setSearch(val);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => setDebouncedSearch(val), 400);
  }

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: 'email', header: 'Email',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.email}</p>
          <p className="text-xs text-muted-foreground">{row.original.name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'role', header: 'Vai trò',
      cell: ({ row }) => (
        <Badge variant={row.original.role === 'admin' ? 'default' : 'secondary'}>
          {row.original.role === 'admin' ? 'Admin' : 'User'}
        </Badge>
      ),
    },
    {
      accessorKey: 'isActive', header: 'Trạng thái',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'outline' : 'destructive'}>
          {row.original.isActive ? 'Hoạt động' : 'Bị khóa'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt', header: 'Ngày đăng ký',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('vi-VN'),
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => {
        const user = row.original;
        if (user.role === 'admin') return null;
        return (
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost" size="icon"
              title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
              onClick={() => handleBan(user)}
            >
              {user.isActive
                ? <ShieldOff className="h-4 w-4 text-amber-500" />
                : <ShieldCheck className="h-4 w-4 text-green-600" />}
            </Button>
            <Button variant="ghost" size="icon" title="Xóa tài khoản" onClick={() => handleDelete(user)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Người dùng</h1>
        <p className="text-muted-foreground text-sm">
          {data ? `${data.total} người dùng` : 'Đang tải...'}
        </p>
      </div>

      <Input placeholder="Tìm kiếm email..." value={search}
        onChange={(e) => handleSearchChange(e.target.value)} className="max-w-sm" />

      <DataTable columns={columns} data={data?.items ?? []} isLoading={isPending} />
    </div>
  );
}
