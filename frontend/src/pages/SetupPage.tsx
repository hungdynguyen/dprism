import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { useCaseEditor } from '@/hooks/useCaseEditor';
import { useProposePlan, useSampleCase, useSharedCases } from '@/hooks/useCases';
import { PlanPage } from '@/pages/PlanPage';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { PageHeader } from '@/components/PageHeader';
import { Documents } from '@/components/plan/Documents';
import { ErrorState, Loading } from '@/components/AsyncState';
import { validateCase } from '@/utils/plan';
import type { CaseContext, ValidationIssue } from '@/types';
function SetupInput({ step }: Readonly<{ step: number }>) {
  const { id = '' } = useParams(),
    editor = useCaseEditor(id),
    shared = useSharedCases(),
    proposal = useProposePlan(),
    sample = useSampleCase(),
    navigate = useNavigate();
  const [issues, setIssues] = useState<ValidationIssue[]>([]),
    draft = editor.draft;
  if (editor.isPending || !draft)
    return editor.error ? <ErrorState error={editor.error} /> : <Loading />;
  if (draft.runId) return <Navigate to={`/runs/${draft.runId}`} replace />;
  const next = async () => {
    const errors = step === 1 ? validateCase(draft, true) : [];
    setIssues(errors);
    if (errors.length) {
      document.getElementById(errors[0].field)?.focus();
      return;
    }
    try {
      await editor.save({ ...draft, wizardStep: step + 1 });
      if (step === 2 && !draft.tasks.length) await proposal.mutateAsync(id);
      navigate(`/cases/${id}/setup/${step + 1}`);
    } catch {
      /* Mutation errors stay visible. */
    }
  };
  const back = async () => {
    try {
      await editor.save();
      navigate(step === 1 ? '/cases' : `/cases/${id}/setup/1`);
    } catch {
      /* Keep unsaved edits visible. */
    }
  };
  const loadSample = async () => {
    try {
      const result = await sample.mutateAsync();
      editor.update((old) => ({
        context: result.context,
        output: old.output || 'Bảng rủi ro, bằng chứng, bất đồng và trace.',
        documents: [...old.documents.filter((d) => d.id !== result.document.id), result.document],
      }));
    } catch {
      /* Inline error below. */
    }
  };
  const fields: { key: keyof CaseContext; label: string; hint: string }[] = [
    { key: 'situation', label: 'Situation · Bối cảnh', hint: 'Điều gì đang diễn ra?' },
    { key: 'task', label: 'Task · Mục tiêu', hint: 'Cần đánh giá hoặc quyết định điều gì?' },
    {
      key: 'action',
      label: 'Action · Phương án & ràng buộc',
      hint: 'Đã thử gì, đang cân nhắc điều gì?',
    },
    {
      key: 'result',
      label: 'Result · Kết quả mong muốn',
      hint: 'Thành công được đánh giá bằng cách nào?',
    },
  ];
  return (
    <div className="mx-auto max-w-4xl">
      <nav aria-label="Các bước chuẩn bị" className="mb-8 grid grid-cols-4 gap-2">
        {['Mô tả vấn đề', 'Case tương tự', 'Thiết kế plan', 'Review & bắt đầu'].map((label, i) => (
          <div
            key={label}
            aria-current={step === i + 1 ? 'step' : undefined}
            className={`border-t-2 pt-3 text-xs ${step === i + 1 ? 'border-primary font-semibold text-primary' : 'border-n2 text-n4'}`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </nav>
      <PageHeader
        eyebrow={`THẢO LUẬN THEO CHỦ ĐỀ · ${step} / 4`}
        title={step === 1 ? 'Mô tả vấn đề' : 'Tìm case tương tự'}
        description={
          step === 1
            ? 'Mục tiêu và đầu ra rõ ràng giúp các expert làm việc đúng phạm vi.'
            : 'Chỉ các case đã được chủ sở hữu chia sẻ mới có thể làm tham khảo.'
        }
        action={
          step === 1 ? (
            <Button onClick={() => void loadSample()}>
              <FileText size={15} />
              Dùng hồ sơ mẫu
            </Button>
          ) : undefined
        }
      />
      {issues.length > 0 && (
        <div
          role="alert"
          className="mb-5 rounded border border-tint-2 bg-tint-3 p-4 text-sm text-primary"
        >
          {issues.map((issue) => (
            <p key={issue.field}>{issue.message}</p>
          ))}
        </div>
      )}
      {step === 1 ? (
        <Card className="space-y-5">
          <Field id="case-title" label="Tên case" required>
            <input
              id="case-title"
              value={draft.title}
              onChange={(e) => editor.update({ title: e.target.value })}
            />
          </Field>
          {fields.map((field) => (
            <Field
              key={field.key}
              id={field.key === 'task' ? 'case-objective' : `context-${field.key}`}
              label={field.label}
              required={field.key === 'task'}
              hint={field.hint}
            >
              <textarea
                id={field.key === 'task' ? 'case-objective' : `context-${field.key}`}
                value={draft.context[field.key]}
                onChange={(e) =>
                  editor.update({ context: { ...draft.context, [field.key]: e.target.value } })
                }
              />
            </Field>
          ))}
          <Field id="case-output" label="Đầu ra cụ thể" required>
            <textarea
              id="case-output"
              value={draft.output}
              onChange={(e) => editor.update({ output: e.target.value })}
              placeholder="Ví dụ: bảng rủi ro, nguồn bằng chứng, bất đồng và các hành động ưu tiên."
            />
          </Field>
          <h3 className="section-title">Tài liệu bổ sung</h3>
          <Documents
            documents={draft.documents}
            onAdd={(doc) => editor.update((old) => ({ documents: [...old.documents, doc] }))}
            onRemove={(documentId) =>
              editor.update((old) => ({
                documents: old.documents.filter((d) => d.id !== documentId),
              }))
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {shared.isPending && <Loading />}
          {shared.error && <ErrorState error={shared.error} />}
          {shared.data?.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start gap-4">
                <input
                  aria-label={`Dùng case ${item.title} làm context`}
                  type="checkbox"
                  className="mt-1"
                  checked={draft.referenceCaseIds.includes(item.id)}
                  onChange={(e) =>
                    editor.update({
                      referenceCaseIds: e.target.checked
                        ? [...draft.referenceCaseIds, item.id]
                        : draft.referenceCaseIds.filter((v) => v !== item.id),
                    })
                  }
                />
                <div className="flex-1">
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="my-2 text-sm text-n4">{item.summary}</p>
                  <p className="helper">{item.owner} · Chia sẻ toàn bộ</p>
                </div>
                <Link to={`/shared/${item.id}`} className="text-xs font-semibold text-primary">
                  Xem chi tiết
                </Link>
              </div>
            </Card>
          ))}
          <p className="helper">Có thể bỏ qua bước này nếu chưa có case phù hợp.</p>
        </div>
      )}
      {(editor.saveError || proposal.error || sample.error) && (
        <ErrorState error={editor.saveError || proposal.error || sample.error} />
      )}
      <footer className="mt-6 flex items-center justify-between">
        <Button onClick={() => void back()}>
          <ArrowLeft size={15} />
          Quay lại
        </Button>
        <span className="hidden text-xs text-n4 sm:block">
          {editor.saving ? 'Đang lưu bản nháp…' : 'Tự động giữ bản nháp'}
        </span>
        <Button
          variant="primary"
          onClick={() => void next()}
          disabled={editor.saving || proposal.isPending}
        >
          {proposal.isPending ? 'Đang đề xuất plan…' : 'Tiếp tục'}
          <ArrowRight size={15} />
        </Button>
      </footer>
    </div>
  );
}
export function SetupPage() {
  const { step = '1' } = useParams(),
    number = Number(step);
  if (![1, 2, 3, 4].includes(number)) return <Navigate to="/cases" replace />;
  return number >= 3 ? <PlanPage openStep={number} /> : <SetupInput step={number} />;
}
