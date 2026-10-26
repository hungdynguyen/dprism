import { LoaderCircle } from 'lucide-react';
import { apiErrorMessage } from '@/utils/apiError';
import { Button } from '@/components/Button';
export function Loading({ label = 'Đang tải dữ liệu…' }: Readonly<{ label?: string }>) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-n4" role="status">
      <LoaderCircle className="animate-spin motion-reduce:animate-none" size={19} />
      {label}
    </div>
  );
}
export function ErrorState({ error, retry }: Readonly<{ error: unknown; retry?: () => void }>) {
  return (
    <div className="my-6 rounded-lg border border-tint-2 bg-tint-3 p-5" role="alert">
      <p className="text-sm text-primary">{apiErrorMessage(error)}</p>
      {retry && (
        <Button className="mt-4" onClick={retry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
