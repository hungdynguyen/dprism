import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CaseDraft, Expert } from '@/types';
import { useCreateCase } from '@/hooks/useCases';
import { useStartExpertChat } from '@/hooks/useStartExpertChat';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/Field';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/AsyncState';

export function StartExpertChatDialog({
  expert,
  onClose,
  referenceCaseIds = [],
}: Readonly<{ expert: Expert; onClose: () => void; referenceCaseIds?: string[] }>) {
  const [title, setTitle] = useState('');
  const createdDraft = useRef<CaseDraft | null>(null);
  const create = useCreateCase(),
    start = useStartExpertChat(),
    navigate = useNavigate();
  const pending = create.isPending || start.isPending;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || pending) return;
    try {
      // Retain the created draft on a failed attachment so Retry cannot create duplicate cases.
      createdDraft.current ??= await create.mutateAsync({
        title: title.trim(),
        referenceCaseIds,
        method: 'direct',
      });
      const { chatId } = await start.mutateAsync({
        draft: { ...createdDraft.current, title: title.trim() },
        expert,
      });
      navigate(`/chats/${chatId}`);
    } catch {
      // Keep the name and expert available for an explicit retry.
    }
  };
  return (
    <Modal
      open
      title="Đặt tên case"
      description={`Trao đổi riêng với ${expert.role}. Đặt tên theo vấn đề bạn muốn giải quyết.`}
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <form onSubmit={(event) => void submit(event)}>
        <Field id="direct-case-title" label="Tên case" required>
          <input
            id="direct-case-title"
            required
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Bạn muốn trao đổi về vấn đề gì?"
            disabled={pending}
          />
        </Field>
        {(create.error || start.error) && <ErrorState error={create.error || start.error} />}
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onClose} disabled={pending}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={!title.trim() || pending}>
            {pending ? 'Đang mở…' : 'Bắt đầu trao đổi'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
