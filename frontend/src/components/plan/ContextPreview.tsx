import type { CaseDraft, Expert, Task } from '@/types';
import { useSkills } from '@/hooks/useExperts';
import { useSharedCases } from '@/hooks/useCases';
import { Modal } from '@/components/Modal';
export function ContextPreview({
  draft,
  task,
  experts,
  onClose,
}: Readonly<{ draft: CaseDraft; task: Task | null; experts: Expert[]; onClose: () => void }>) {
  const skills = useSkills(),
    shared = useSharedCases();
  if (!task) return null;
  const documents = draft.documents.filter(
    (d) => d.kind === 'case' || task.documentIds.includes(d.id),
  );
  return (
    <Modal
      open
      title={`${task.id} · Context đầu vào`}
      description="Mỗi expert nhận hồ sơ, kỹ năng và tài liệu đúng phạm vi; không nhìn bài đánh giá độc lập của expert khác."
      onClose={onClose}
    >
      <div className="space-y-6">
        <section>
          <h3 className="section-title">Hồ sơ chung</h3>
          <p className="mt-2 text-n4">{draft.context.task || 'Chưa mô tả mục tiêu.'}</p>
        </section>
        <section>
          <h3 className="section-title">Tài liệu được cấp</h3>
          {documents.map((d) => (
            <p className="mt-2 text-xs text-n4" key={d.id}>
              {d.name} · {d.status === 'ready' ? 'Có nội dung' : 'Chưa đọc nội dung'}
            </p>
          ))}
        </section>
        <section>
          <h3 className="section-title">Case công khai làm tham khảo</h3>
          {shared.data
            ?.filter((c) => draft.referenceCaseIds.includes(c.id))
            .map((c) => (
              <p className="mt-2 text-xs text-n4" key={c.id}>
                {c.title}: {c.summary}
              </p>
            ))}
          {!draft.referenceCaseIds.length && <p className="helper">Không chọn case tham khảo.</p>}
        </section>
        <section>
          <h3 className="section-title">Upstream brief</h3>
          <p className="mt-2 text-sm text-n4">
            {task.dependsOn.length
              ? `Chỉ nhận kết luận có cấu trúc từ ${task.dependsOn.join(', ')} sau khi các task đó hoàn tất. Không truyền toàn bộ chat log.`
              : 'Task gốc; không có cấu phần upstream.'}
          </p>
        </section>
        {experts
          .filter((e) => task.expertIds.includes(e.id))
          .map((e) => (
            <details key={e.id} className="border-t border-n2 pt-3">
              <summary className="cursor-pointer font-semibold">{e.role}</summary>
              <p className="mt-3 text-sm text-n4">{e.systemPrompt}</p>
              {skills.data
                ?.filter((s) => e.skillIds.includes(s.id))
                .map((s) => (
                  <pre
                    key={s.id}
                    className="mt-3 whitespace-pre-wrap rounded bg-n1 p-3 text-xs leading-6"
                  >
                    {s.content}
                  </pre>
                ))}
            </details>
          ))}
      </div>
    </Modal>
  );
}
