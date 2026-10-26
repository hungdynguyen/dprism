import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCase } from '@/hooks/useCases';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { ErrorState } from '@/components/AsyncState';
export function CreateCaseDialog({
  open,
  onClose,
  referenceCaseIds = [],
}: Readonly<{ open: boolean; onClose: () => void; referenceCaseIds?: string[] }>) {
  const [title, setTitle] = useState(''),
    mutation = useCreateCase(),
    navigate = useNavigate();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      const item = await mutation.mutateAsync({ title: title.trim(), referenceCaseIds });
      setTitle('');
      onClose();
      navigate(`/cases/${item.id}/start`);
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
      title="Tạo case mới"
      description="Đặt tên để dễ tìm lại. Bạn sẽ chọn cách bắt đầu ở màn hình tiếp theo."
    >
      <form onSubmit={(event) => void submit(event)}>
        <Field id="new-case-title" label="Tên case" required>
          <input
            id="new-case-title"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Thẩm định AutoSupport trước pilot"
          />
        </Field>
        {mutation.error && <ErrorState error={mutation.error} />}
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onClose} disabled={mutation.isPending}>
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
