import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, LoaderCircle, Play, Save } from 'lucide-react';
import { useCaseEditor } from '@/hooks/useCaseEditor';
import { useCreateTemplate, useProposePlan } from '@/hooks/useCases';
import { useExperts } from '@/hooks/useExperts';
import { useStartRun } from '@/hooks/useRuns';
import { PlanningWorkspace } from '@/components/plan/PlanningWorkspace';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/Field';
import { ErrorState, Loading } from '@/components/AsyncState';
import { validateCase } from '@/utils/plan';
import type { ValidationIssue } from '@/types';
import { useConfirm } from '@/components/ConfirmDialog';
export function PlanPage({ openStep }: Readonly<{ openStep?: number }>) {
  const { id = '' } = useParams(),
    editor = useCaseEditor(id),
    experts = useExperts(),
    start = useStartRun(),
    template = useCreateTemplate(),
    navigate = useNavigate();
  const [issues, setIssues] = useState<ValidationIssue[]>([]),
    [savingTemplate, setSavingTemplate] = useState(false),
    [templateName, setTemplateName] = useState('');
  const proposal = useProposePlan(),
    confirm = useConfirm(),
    [generation, setGeneration] = useState(0);
  const draft = editor.draft,
    designing = openStep === 3;
  if (editor.isPending || experts.isPending || !draft)
    return editor.error || experts.error ? (
      <ErrorState error={editor.error || experts.error} />
    ) : (
      <Loading />
    );
  if (editor.error || experts.error) return <ErrorState error={editor.error || experts.error} />;
  if (draft.runId) return <Navigate to={`/runs/${draft.runId}`} replace />;
  if (!openStep && draft.method === 'template' && !draft.templateId)
    return <Navigate to={`/cases/${id}/templates`} replace />;
  const proceed = async () => {
    const errors = validateCase(draft);
    setIssues(errors);
    if (errors.length) return;
    try {
      await editor.save({ ...draft, wizardStep: designing ? 4 : draft.wizardStep });
      if (designing) navigate(`/cases/${id}/setup/4`);
      else {
        const run = await start.mutateAsync(id);
        navigate(`/runs/${run.id}`);
      }
    } catch {
      /* The mutation error is rendered below. */
    }
  };
  const back = async () => {
    try {
      await editor.save();
      navigate(openStep ? `/cases/${id}/setup/${designing ? 2 : 3}` : `/cases/${id}/templates`);
    } catch {
      /* Remain on the page if saving fails. */
    }
  };
  const regenerate = async () => {
    if (
      !(await confirm({
        title: 'Tạo lại plan đề xuất?',
        message:
          'Các task và phân công hiện tại sẽ được thay thế. Hồ sơ, mục tiêu và đầu ra của case được giữ lại.',
        confirmLabel: 'Tạo lại plan',
      }))
    )
      return;
    try {
      await editor.save(draft);
      const next = await proposal.mutateAsync(id);
      editor.replace(next);
      setIssues([]);
      setGeneration((value) => value + 1);
    } catch {
      /* Mutation feedback is shown below. */
    }
  };
  const saveTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors = validateCase(draft);
    if (errors.length) {
      setIssues(errors);
      setSavingTemplate(false);
      return;
    }
    try {
      await template.mutateAsync({
        title: templateName.trim(),
        description: 'Quy trình được lưu từ plan của case.',
        category: 'Template của tôi',
        output: draft.output,
        tasks: draft.tasks,
        documents: draft.documents.filter(
          (d) => d.kind === 'reference' || draft.tasks.some((t) => t.documentIds.includes(d.id)),
        ),
      });
      setSavingTemplate(false);
    } catch {
      /* Keep dialog open with feedback. */
    }
  };
  return (
    <div className="workspace">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs text-n4">
            {openStep
              ? `${openStep} / 4 · ${designing ? 'Thiết kế plan' : 'Review & bắt đầu'}`
              : 'TEMPLATE · FINAL REVIEW'}
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            {designing ? 'Thiết kế plan' : 'Review plan & bắt đầu'}
          </h1>
        </div>
        <div className="flex gap-2">
          {designing && (
            <Button
              onClick={() => void regenerate()}
              disabled={proposal.isPending || editor.saving}
            >
              Tạo lại plan đề xuất
            </Button>
          )}
          <Button
            onClick={() => {
              setTemplateName(draft.title);
              setSavingTemplate(true);
            }}
          >
            <Save size={15} />
            Lưu thành template
          </Button>
        </div>
      </header>
      <PlanningWorkspace
        key={generation}
        draft={draft}
        experts={experts.data}
        update={editor.update}
        issues={issues.length ? validateCase(draft) : []}
        saving={editor.saving}
        saveError={editor.saveError}
        onSave={() => void editor.save().catch(() => {})}
        readonly={openStep === 4 || start.isPending}
      />
      {(start.error || proposal.error) && <ErrorState error={start.error || proposal.error} />}
      <footer className="flex shrink-0 items-center justify-between gap-3">
        <Button onClick={() => void back()}>
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">
            {openStep ? (designing ? 'Case liên quan' : 'Chỉnh plan') : 'Chọn template khác'}
          </span>
        </Button>
        <span className="hidden text-xs text-n4 sm:block">
          Plan được cố định sau khi bắt đầu. Bất đồng được giữ lại.
        </span>
        <Button
          variant="primary"
          onClick={() => void proceed()}
          disabled={start.isPending || editor.saving}
        >
          {start.isPending ? (
            <LoaderCircle
              size={15}
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
            />
          ) : (
            <Play size={15} />
          )}
          {start.isPending ? 'Đang bắt đầu…' : designing ? 'Review plan' : 'Bắt đầu thảo luận'}
        </Button>
      </footer>
      <Modal
        open={savingTemplate}
        title="Lưu thành template"
        onClose={() => setSavingTemplate(false)}
      >
        <form onSubmit={(event) => void saveTemplate(event)}>
          <Field id="template-name" label="Tên template" required>
            <input
              id="template-name"
              required
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </Field>
          {template.error && <ErrorState error={template.error} />}
          <Button
            type="submit"
            variant="primary"
            className="mt-5"
            disabled={template.isPending || !templateName.trim()}
          >
            Lưu template
          </Button>
        </form>
      </Modal>
    </div>
  );
}
