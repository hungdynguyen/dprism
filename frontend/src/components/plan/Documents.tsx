import { useState } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { useUploadDocument } from '@/hooks/useCases';
import type { PlanDocument } from '@/types';
import { Modal } from '@/components/Modal';
import { ErrorState } from '@/components/AsyncState';
export function DocumentPreview({
  document,
  onClose,
}: Readonly<{ document: PlanDocument | null; onClose: () => void }>) {
  return (
    <Modal open={!!document} title={document?.name || ''} onClose={onClose}>
      {document?.status === 'metadata-only' ? (
        <p className="text-n4">
          Chưa trích xuất nội dung. Hiện chỉ có thông tin file; tài liệu này không được xem là bằng
          chứng đã đọc.
        </p>
      ) : (
        <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-n5">
          {document?.content}
        </pre>
      )}
    </Modal>
  );
}
export function Documents({
  documents,
  onAdd,
  onRemove,
}: Readonly<{
  documents: PlanDocument[];
  onAdd?: (doc: PlanDocument) => void;
  onRemove?: (id: string) => void;
}>) {
  const mutation = useUploadDocument(),
    [preview, setPreview] = useState<PlanDocument | null>(null),
    [error, setError] = useState('');
  const upload = async (files: FileList | null) => {
    if (!files || !onAdd) return;
    setError('');
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024 || !/\.(txt|md|csv|pdf|docx)$/i.test(file.name)) {
        setError('Chỉ nhận TXT, MD, CSV, PDF, DOCX; tối đa 10 MB mỗi file.');
        continue;
      }
      try {
        onAdd(await mutation.mutateAsync(file));
      } catch {
        /* API error is shown below. */
      }
    }
  };
  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-2 rounded-md border border-n2 bg-n1/40 p-2.5"
        >
          <FileText size={15} className="shrink-0 text-n4" />
          <button
            type="button"
            onClick={() => setPreview(doc)}
            className="min-w-0 flex-1 text-left"
          >
            <strong className="block break-words text-xs font-medium">{doc.name}</strong>
            <span className="text-[11px] text-n4">
              {doc.status === 'ready' ? 'Nội dung sẵn sàng' : 'Chỉ có thông tin file'}
            </span>
          </button>
          {onRemove && (
            <button
              type="button"
              aria-label={`Gỡ ${doc.name}`}
              onClick={() => onRemove(doc.id)}
              className="rounded p-1 text-n4"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
      {!documents.length && <p className="helper">Chưa có tài liệu.</p>}
      {onAdd && (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-n3 p-3 text-xs font-semibold text-n4">
          <Plus size={14} />
          {mutation.isPending ? 'Đang tải tài liệu…' : 'Thêm tài liệu'}
          <input
            type="file"
            className="sr-only"
            accept=".txt,.md,.csv,.pdf,.docx"
            multiple
            disabled={mutation.isPending}
            onChange={(event) => {
              void upload(event.target.files);
              event.target.value = '';
            }}
          />
        </label>
      )}
      {error && (
        <p role="alert" className="text-xs text-primary">
          {error}
        </p>
      )}
      {mutation.error && <ErrorState error={mutation.error} />}
      <DocumentPreview document={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
