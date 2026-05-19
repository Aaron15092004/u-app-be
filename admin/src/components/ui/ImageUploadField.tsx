import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ImageUploadFieldProps {
  folder: 'exercises' | 'food-items';
  value: string | null | undefined;
  onChange: (url: string | null) => void;
}

export function ImageUploadField({ folder, value, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('image', file);
      // Do NOT set Content-Type — axios sets it with boundary automatically
      const { data } = await apiClient.post<{ success: true; data: { url: string } }>(
        `/api/admin/upload?folder=${folder}`,
        form,
      );
      return data.data.url;
    },
    onSuccess: (url) => {
      setPreview(url);
      onChange(url);
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
  }

  return (
    <div className="space-y-2">
      {uploadMutation.isPending ? (
        <Skeleton className="h-32 w-32 rounded-md" />
      ) : preview ? (
        <div className="relative w-32 h-32">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover rounded-md border"
          />
          <button
            type="button"
            onClick={() => { setPreview(null); onChange(null); }}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center"
          >
            ×
          </button>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploadMutation.isPending}
      >
        {uploadMutation.isPending ? 'Đang tải...' : preview ? 'Đổi ảnh' : 'Chọn ảnh'}
      </Button>
      {uploadMutation.isError && (
        <p className="text-sm text-destructive">Lỗi upload ảnh. Thử lại.</p>
      )}
    </div>
  );
}
