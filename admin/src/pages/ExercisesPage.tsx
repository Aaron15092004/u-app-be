import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useForm, useFieldArray } from 'react-hook-form';
import type { Resolver as FormResolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise, Exercise } from '@/features/exercises/useExercises';
import { DataTable } from '@/components/data-table/DataTable';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const CATEGORY_LABELS: Record<string, string> = {
  yoga: 'Yoga', cardio: 'Cardio', weights: 'Tạ', stretching: 'Giãn cơ',
};
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Dễ', medium: 'Trung bình', hard: 'Khó',
};

const stepSchema = z.object({
  order: z.coerce.number().int().min(1),
  instruction: z.string().min(1, 'Tên động tác không được để trống'),
  durationSeconds: z.coerce.number().int().min(0).optional(),
});

const exerciseSchema = z.object({
  name: z.string().min(1, 'Tên bài tập không được để trống'),
  nameEn: z.string().optional(),
  category: z.enum(['yoga', 'cardio', 'weights', 'stretching']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  durationMinutes: z.coerce.number().min(1, 'Thời gian tối thiểu 1 phút'),
  caloriesBurned: z.coerce.number().min(0),
  description: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  steps: z.array(stepSchema),
});

type ExerciseFormValues = z.infer<typeof exerciseSchema>;

export function ExercisesPage() {
  const [page] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Exercise | null>(null);
  const { data, isPending } = useExercises(page, debouncedSearch);
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const deleteMutation = useDeleteExercise();

  const form = useForm<ExerciseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(exerciseSchema) as FormResolver<ExerciseFormValues>,
    defaultValues: { steps: [{ order: 1, instruction: '', durationSeconds: 30 }] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'steps' });

  function openCreate() {
    form.reset({ steps: [{ order: 1, instruction: '', durationSeconds: 30 }] });
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(ex: Exercise) {
    form.reset({
      name: ex.name,
      nameEn: ex.nameEn ?? '',
      category: ex.category,
      difficulty: ex.difficulty,
      durationMinutes: ex.durationMinutes,
      caloriesBurned: ex.caloriesBurned,
      description: ex.description ?? '',
      imageUrl: ex.imageUrl ?? null,
      steps: ex.steps.length > 0 ? ex.steps : [{ order: 1, instruction: '', durationSeconds: 30 }],
    });
    setEditTarget(ex);
    setDialogOpen(true);
  }

  async function handleSubmit(values: ExerciseFormValues) {
    try {
      if (editTarget) {
        await updateMutation.mutateAsync({ id: editTarget._id, data: values });
        toast('Cập nhật thành công');
      } else {
        await createMutation.mutateAsync(values as Parameters<typeof createMutation.mutateAsync>[0]);
        toast('Tạo bài tập thành công');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Không thể lưu bài tập');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa bài tập này?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast('Đã xóa');
    } catch {
      toast.error('Không thể xóa bài tập');
    }
  }

  let searchTimer: ReturnType<typeof setTimeout>;
  function handleSearchChange(val: string) {
    setSearch(val);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => setDebouncedSearch(val), 400);
  }

  const columns: ColumnDef<Exercise>[] = [
    { accessorKey: 'name', header: 'Tên bài tập', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: 'category', header: 'Danh mục', cell: ({ row }) => <Badge variant="outline">{CATEGORY_LABELS[row.original.category]}</Badge> },
    { accessorKey: 'difficulty', header: 'Độ khó', cell: ({ row }) => DIFFICULTY_LABELS[row.original.difficulty] },
    { accessorKey: 'durationMinutes', header: 'Thời gian', cell: ({ row }) => `${row.original.durationMinutes} phút` },
    { accessorKey: 'caloriesBurned', header: 'Calo' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bài tập</h1>
          <p className="text-muted-foreground text-sm">Quản lý thư viện bài tập</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Thêm bài tập</Button>
      </div>

      <Input
        placeholder="Tìm kiếm bài tập..."
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="max-w-sm"
      />

      <DataTable columns={columns} data={data?.items ?? []} isLoading={isPending} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Chỉnh sửa bài tập' : 'Thêm bài tập mới'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Tên bài tập *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="nameEn" render={({ field }) => (
                  <FormItem><FormLabel>Tên tiếng Anh</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Danh mục *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="difficulty" render={({ field }) => (
                  <FormItem><FormLabel>Độ khó *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Chọn độ khó" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(DIFFICULTY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="durationMinutes" render={({ field }) => (
                  <FormItem><FormLabel>Thời gian (phút) *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="caloriesBurned" render={({ field }) => (
                  <FormItem><FormLabel>Calo đốt</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem><FormLabel>Ảnh bài tập</FormLabel>
                  <FormControl>
                    <ImageUploadField folder="exercises" value={field.value} onChange={field.onChange} />
                  </FormControl><FormMessage /></FormItem>
              )} />

              {/* Dynamic steps */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Danh sách động tác</p>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end">
                    <FormField control={form.control} name={`steps.${index}.instruction`} render={({ field: f }) => (
                      <FormItem className="flex-1">
                        {index === 0 && <FormLabel>Tên động tác</FormLabel>}
                        <FormControl><Input placeholder="Tên động tác" {...f} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`steps.${index}.durationSeconds`} render={({ field: f }) => (
                      <FormItem className="w-28">
                        {index === 0 && <FormLabel>Giây</FormLabel>}
                        <FormControl><Input type="number" placeholder="30" {...f} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}
                      className="mb-0.5"><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm"
                  onClick={() => append({ order: fields.length + 1, instruction: '', durationSeconds: 30 })}>
                  + Thêm động tác
                </Button>
              </div>

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
