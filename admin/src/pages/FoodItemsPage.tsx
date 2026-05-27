import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import type { Resolver as FormResolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFoodItems, useCreateFoodItem, useUpdateFoodItem, useDeleteFoodItem, FoodItem } from '@/features/food-items/useFoodItems';
import { DataTable } from '@/components/data-table/DataTable';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const foodSchema = z.object({
  name: z.string().min(1, 'Tên món ăn không được để trống'),
  nameEn: z.string().optional(),
  kcalPer100g: z.coerce.number().min(0, 'Calo phải >= 0'),
  protein: z.coerce.number().min(0).default(0),
  carbs: z.coerce.number().min(0).default(0),
  fat: z.coerce.number().min(0).default(0),
  fiber: z.coerce.number().min(0).default(0),
  sugar: z.coerce.number().min(0).default(0),
  sodium: z.coerce.number().min(0).default(0),
  vitaminC: z.coerce.number().min(0).default(0),
  category: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
});

type FoodFormValues = z.infer<typeof foodSchema>;

export function FoodItemsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FoodItem | null>(null);
  const { data, isPending } = useFoodItems(page, debouncedSearch);
  const createMutation = useCreateFoodItem();
  const updateMutation = useUpdateFoodItem();
  const deleteMutation = useDeleteFoodItem();

  const form = useForm<FoodFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(foodSchema) as FormResolver<FoodFormValues>,
  });

  function openCreate() {
    form.reset({ protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, vitaminC: 0 });
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(item: FoodItem) {
    form.reset({
      name: item.name, nameEn: item.nameEn ?? '', kcalPer100g: item.kcalPer100g,
      protein: item.protein, carbs: item.carbs, fat: item.fat,
      fiber: item.fiber, sugar: item.sugar, sodium: item.sodium, vitaminC: item.vitaminC,
      category: item.category ?? '', imageUrl: item.imageUrl ?? null,
    });
    setEditTarget(item);
    setDialogOpen(true);
  }

  async function handleSubmit(values: FoodFormValues) {
    try {
      if (editTarget) {
        await updateMutation.mutateAsync({ id: editTarget._id, data: values });
        toast('Cập nhật thành công');
      } else {
        await createMutation.mutateAsync(values as Parameters<typeof createMutation.mutateAsync>[0]);
        toast('Tạo thực phẩm thành công');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Không thể lưu thực phẩm');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa thực phẩm này?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast('Đã xóa');
    } catch {
      toast.error('Không thể xóa thực phẩm');
    }
  }

  let searchTimer: ReturnType<typeof setTimeout>;
  function handleSearchChange(val: string) {
    setSearch(val);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 400);
  }

  const columns: ColumnDef<FoodItem>[] = [
    { accessorKey: 'name', header: 'Tên món ăn', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: 'kcalPer100g', header: 'Calo/100g' },
    { accessorKey: 'protein', header: 'Protein (g)' },
    { accessorKey: 'carbs', header: 'Carbs (g)' },
    { accessorKey: 'fat', header: 'Fat (g)' },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    },
  ];

  type NumericField = 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar' | 'sodium' | 'vitaminC';
  const MACRO_FIELDS: Array<{ name: NumericField; label: string }> = [
    { name: 'protein', label: 'Protein (g)' },
    { name: 'carbs', label: 'Carbs (g)' },
    { name: 'fat', label: 'Fat (g)' },
    { name: 'fiber', label: 'Chất xơ (g)' },
    { name: 'sugar', label: 'Đường (g)' },
    { name: 'sodium', label: 'Natri (mg)' },
    { name: 'vitaminC', label: 'Vitamin C (mg)' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thực phẩm</h1>
          <p className="text-muted-foreground text-sm">Quản lý cơ sở dữ liệu thực phẩm</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Thêm thực phẩm</Button>
      </div>

      <Input placeholder="Tìm kiếm thực phẩm..." value={search}
        onChange={(e) => handleSearchChange(e.target.value)} className="max-w-sm" />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isPending}
        serverPagination={{ page, totalPages: data?.totalPages ?? 1, onPageChange: setPage }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Chỉnh sửa thực phẩm' : 'Thêm thực phẩm mới'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Tên món ăn *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="nameEn" render={({ field }) => (
                  <FormItem><FormLabel>Tên tiếng Anh</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="kcalPer100g" render={({ field }) => (
                  <FormItem><FormLabel>Calo/100g *</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Phân loại</FormLabel><FormControl><Input placeholder="Vd: Cơm, Thịt..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {MACRO_FIELDS.map(({ name, label }) => (
                  <FormField key={name} control={form.control} name={name} render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">{label}</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                ))}
              </div>
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem><FormLabel>Ảnh thực phẩm</FormLabel>
                  <FormControl><ImageUploadField folder="food-items" value={field.value} onChange={field.onChange} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editTarget ? 'Cập nhật' : 'Tạo mới'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
