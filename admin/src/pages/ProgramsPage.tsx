import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import type { Resolver as FormResolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, X, ListChecks } from "lucide-react";
import { toast } from "sonner";
import {
  usePrograms,
  useCreateProgram,
  useUpdateProgram,
  useDeleteProgram,
  Program,
} from "@/features/programs/usePrograms";
import { useExerciseOptions } from "@/features/exercises/useExercises";
import { DataTable } from "@/components/data-table/DataTable";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Người mới",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

const CATEGORY_LABELS: Record<string, string> = {
  yoga: "Yoga",
  cardio: "Cardio",
  weights: "Tạ",
  stretching: "Giãn cơ",
};

type LevelValue = "beginner" | "intermediate" | "advanced";
type CategoryValue = "yoga" | "cardio" | "weights" | "stretching";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const exerciseSchema = z.object({
  exerciseId: z.string().optional(),
  exerciseName: z.string().min(1, "Chọn bài tập"),
  category: z.string().optional(),
  durationSeconds: z.coerce.number().int().min(1, "Tối thiểu 1 giây"),
  restSeconds: z.coerce.number().int().min(0, "Không được âm"),
  order: z.coerce.number().int().min(1),
});

const daySchema = z.object({
  dayNumber: z.coerce.number().int().min(1),
  title: z.string().min(1, "Tiêu đề ngày không được để trống"),
  exercises: z.array(exerciseSchema),
});

const programSchema = z.object({
  title: z.string().min(1, "Tên chương trình không được để trống"),
  titleEn: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  description: z.string().optional(),
  estimatedWeeks: z.coerce.number().int().min(1, "Tối thiểu 1 tuần"),
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  days: z.array(daySchema),
});

type ProgramFormValues = z.infer<typeof programSchema>;

// ---------------------------------------------------------------------------
// Nested exercise rows subcomponent
// ---------------------------------------------------------------------------

interface ExercisesEditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
  dayIndex: number;
}

function ExercisesEditor({ control, setValue, dayIndex }: ExercisesEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `days.${dayIndex}.exercises`,
  });

  const { data: exerciseOptions = [] } = useExerciseOptions();

  function pickExercise(exIndex: number, exerciseId: string) {
    const found = exerciseOptions.find((e) => e._id === exerciseId);
    if (!found) return;
    setValue(`days.${dayIndex}.exercises.${exIndex}.exerciseId`, exerciseId);
    setValue(`days.${dayIndex}.exercises.${exIndex}.exerciseName`, found.name);
    setValue(`days.${dayIndex}.exercises.${exIndex}.category`, found.category);
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Bài tập trong ngày
      </p>

      {fields.map((exField, exIndex) => (
        <div
          key={exField.id}
          className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-end"
        >
          {/* exercise picker */}
          <FormField
            control={control}
            name={`days.${dayIndex}.exercises.${exIndex}.exerciseId`}
            render={({ field }) => (
              <FormItem>
                {exIndex === 0 && (
                  <FormLabel className="text-xs">Bài tập</FormLabel>
                )}
                <Select
                  onValueChange={(val) => pickExercise(exIndex, val)}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Chọn bài tập..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {exerciseOptions.map((ex) => (
                      <SelectItem key={ex._id} value={ex._id} className="text-xs">
                        <span className="font-medium">{ex.name}</span>
                        <span className="ml-2 text-muted-foreground">
                          {CATEGORY_LABELS[ex.category] ?? ex.category}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* durationSeconds */}
          <FormField
            control={control}
            name={`days.${dayIndex}.exercises.${exIndex}.durationSeconds`}
            render={({ field }) => (
              <FormItem>
                {exIndex === 0 && (
                  <FormLabel className="text-xs">Giây tập</FormLabel>
                )}
                <FormControl>
                  <Input type="number" placeholder="45" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* restSeconds */}
          <FormField
            control={control}
            name={`days.${dayIndex}.exercises.${exIndex}.restSeconds`}
            render={({ field }) => (
              <FormItem>
                {exIndex === 0 && (
                  <FormLabel className="text-xs">Giây nghỉ</FormLabel>
                )}
                <FormControl>
                  <Input type="number" placeholder="20" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* delete */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(exIndex)}
            className="self-end"
          >
            <X className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={() =>
          append({
            exerciseId: undefined,
            exerciseName: "",
            category: undefined,
            durationSeconds: 45,
            restSeconds: 20,
            order: fields.length + 1,
          })
        }
      >
        <Plus className="h-3 w-3 mr-1" />
        Thêm bài tập
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Days editor subcomponent
// ---------------------------------------------------------------------------

interface DaysEditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
}

function DaysEditor({ control, setValue }: DaysEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "days",
  });

  const days = useWatch({ control, name: "days" }) as ProgramFormValues["days"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Ngày tập ({fields.length})</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              dayNumber: fields.length + 1,
              title: `Ngày ${fields.length + 1}`,
              exercises: [],
            })
          }
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Thêm ngày
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          Chưa có ngày nào. Nhấn "Thêm ngày" để bắt đầu.
        </p>
      )}

      {fields.map((dayField, dayIndex) => {
        const dayData = days?.[dayIndex];
        const exCount = dayData?.exercises?.length ?? 0;

        return (
          <div
            key={dayField.id}
            className="border rounded-lg p-4 space-y-3 bg-muted/30"
          >
            {/* Day header */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground w-16 shrink-0">
                Ngày {dayIndex + 1}
              </span>

              <FormField
                control={control}
                name={`days.${dayIndex}.title`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="Tiêu đề ngày (vd: Khởi động)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* hidden dayNumber sync */}
              <FormField
                control={control}
                name={`days.${dayIndex}.dayNumber`}
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="number" {...field} value={dayIndex + 1} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {exCount} bài tập
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={fields.length <= 1}
                onClick={() => remove(dayIndex)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>

            {/* Exercises nested editor */}
            <ExercisesEditor control={control} setValue={setValue} dayIndex={dayIndex} />
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function levelBadgeVariant(level: LevelValue) {
  if (level === "beginner") return "default" as const;
  if (level === "intermediate") return "secondary" as const;
  return "destructive" as const;
}

function levelBadgeClass(level: LevelValue) {
  if (level === "beginner")
    return "bg-green-100 text-green-800 border-green-200";
  if (level === "intermediate")
    return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

export function ProgramsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Program | null>(null);

  const { data, isPending } = usePrograms(debouncedSearch);
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram();
  const deleteMutation = useDeleteProgram();

  const form = useForm<ProgramFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(programSchema) as FormResolver<ProgramFormValues>,
    defaultValues: {
      title: "",
      titleEn: "",
      level: "beginner",
      description: "",
      estimatedWeeks: 4,
      imageUrl: null,
      isActive: true,
      days: [],
    },
  });

  // ---------------------------------------------------------------------------
  // Dialog helpers
  // ---------------------------------------------------------------------------

  function openCreate() {
    form.reset({
      title: "",
      titleEn: "",
      level: "beginner",
      description: "",
      estimatedWeeks: 4,
      imageUrl: null,
      isActive: true,
      days: [],
    });
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(program: Program) {
    form.reset({
      title: program.title,
      titleEn: program.titleEn ?? "",
      level: program.level,
      description: program.description ?? "",
      estimatedWeeks: program.estimatedWeeks,
      imageUrl: program.imageUrl ?? null,
      isActive: program.isActive,
      days: program.days.map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        exercises: d.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          category: e.category as CategoryValue | undefined,
          durationSeconds: e.durationSeconds,
          restSeconds: e.restSeconds,
          order: e.order,
        })),
      })),
    });
    setEditTarget(program);
    setDialogOpen(true);
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit(values: ProgramFormValues) {
    try {
      // Normalise dayNumber to match actual index
      const normalised = {
        ...values,
        days: values.days.map((d, i) => ({
          ...d,
          dayNumber: i + 1,
          exercises: d.exercises.map((e, ei) => ({ ...e, order: ei + 1 })),
        })),
      };

      if (editTarget) {
        await updateMutation.mutateAsync({
          id: editTarget._id,
          data: normalised,
        });
        toast("Cập nhật chương trình thành công");
      } else {
        await createMutation.mutateAsync(normalised);
        toast("Tạo chương trình thành công");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Không thể lưu chương trình");
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  async function handleDelete(id: string) {
    if (!confirm("Xóa chương trình này?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast("Đã xóa chương trình");
    } catch {
      toast.error("Không thể xóa chương trình");
    }
  }

  // ---------------------------------------------------------------------------
  // Search debounce
  // ---------------------------------------------------------------------------

  let searchTimer: ReturnType<typeof setTimeout>;
  function handleSearchChange(val: string) {
    setSearch(val);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      setDebouncedSearch(val);
    }, 400);
  }

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const columns: ColumnDef<Program>[] = [
    {
      accessorKey: "title",
      header: "Tên chương trình",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.title}</span>
          <Badge
            variant="outline"
            className={levelBadgeClass(row.original.level)}
          >
            {LEVEL_LABELS[row.original.level]}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "level",
      header: "Cấp độ",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={levelBadgeClass(row.original.level)}
        >
          {LEVEL_LABELS[row.original.level]}
        </Badge>
      ),
    },
    {
      id: "daysCount",
      header: "Số ngày",
      cell: ({ row }) => {
        const p = row.original as Program & { totalDays?: number };
        return `${p.totalDays ?? p.days?.length ?? 0} ngày`;
      },
    },
    {
      accessorKey: "estimatedWeeks",
      header: "Tuần",
      cell: ({ row }) => `${row.original.estimatedWeeks} tuần`,
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge
            className="bg-green-100 text-green-800 border-green-200"
            variant="outline"
          >
            Hoạt động
          </Badge>
        ) : (
          <Badge variant="secondary">Tạm dừng</Badge>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original._id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListChecks className="h-6 w-6" />
            Chương trình
          </h1>
          <p className="text-muted-foreground text-sm">
            Quản lý chương trình luyện tập theo ngày
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast("Đang phát triển")}>
            Seed mẫu
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm chương trình
          </Button>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Tìm kiếm chương trình..."
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <DataTable columns={columns} data={data ?? []} isLoading={isPending} />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[90vw]! w-[90vw] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Chỉnh sửa chương trình" : "Thêm chương trình mới"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-5"
            >
              {/* Row 1: title + titleEn */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên chương trình *</FormLabel>
                      <FormControl>
                        <Input placeholder="Vd: 30 Ngày Người Mới" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="titleEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên tiếng Anh</FormLabel>
                      <FormControl>
                        <Input placeholder="Vd: 30-Day Beginner" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: level + estimatedWeeks */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cấp độ *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn cấp độ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(
                            Object.entries(LEVEL_LABELS) as [
                              LevelValue,
                              string,
                            ][]
                          ).map(([v, l]) => (
                            <SelectItem key={v} value={v}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedWeeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số tuần ước tính *</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Mô tả ngắn về chương trình..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ảnh chương trình</FormLabel>
                    <FormControl>
                      <ImageUploadField
                        folder="programs"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* isActive toggle */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">
                      Kích hoạt chương trình
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Days editor */}
              <div className="border-t pt-4">
                <DaysEditor control={form.control} setValue={form.setValue} />
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editTarget ? "Cập nhật" : "Tạo mới"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
