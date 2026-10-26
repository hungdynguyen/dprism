import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCase } from '@/hooks/useCases';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { ErrorState } from '@/components/AsyncState';
import { caseDestination } from '@/utils/caseNavigation';
export function CreateCaseDialog({
  open,
  onClose,
  referenceCaseIds = [],
  method,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  referenceCaseIds?: string[];
  method: 'template' | 'open';
}>) {
  const [title, setTitle] = useState(''),
    mutation = useCreateCase(),
    navigate = useNavigate();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || mutation.isPending) return;
    try {
      const item = await mutation.mutateAsync({ title: title.trim(), referenceCaseIds, method });
      setTitle('');
      onClose();
      navigate(caseDestination(item));
    } catch {
      /* Feedback is rendered inside the dialog. */
    }
  };
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!mutation.isPending) onClose();
      }}
      title="Đặt tên case"
      description={
        method === 'template'
          ? 'Tiếp theo, chọn template phù hợp và review plan trước khi chạy.'
          : 'Tiếp theo, mô tả vấn đề để xây dựng plan thảo luận với các chuyên gia.'
      }
    >
      <form onSubmit={(event) => void submit(event)}>
        <Field id="new-case-title" label="Tên case" required>
          <input
            id="new-case-title"
            required
            maxLength={120}
            disabled={mutation.isPending}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Thẩm định AutoSupport trước pilot"
          />
        </Field>
        {mutation.error && <ErrorState error={mutation.error} />}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={() => {
              setTitle('');
              mutation.reset();
              onClose();
            }}
            disabled={mutation.isPending}
          >
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={!title.trim() || mutation.isPending}>
            {mutation.isPending ? 'Đang tạo…' : 'Tiếp tục'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
