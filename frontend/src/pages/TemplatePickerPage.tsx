import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FileText, Pencil, Search } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useCaseEditor } from '@/hooks/useCaseEditor';
import { useTemplates } from '@/hooks/useCases';
import { useConfirm } from '@/components/ConfirmDialog';
import { BackLink, PageHeader } from '@/components/PageHeader';
import { ErrorState, Loading } from '@/components/AsyncState';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field } from '@/components/Field';
import { matchesSearch } from '@/utils/format';
import type { CaseDraft, PlanTemplate } from '@/types';
export function TemplatePickerPage() {
  const { id = '' } = useParams(),
    editor = useCaseEditor(id),
    templates = useTemplates(),
    navigate = useNavigate(),
    confirm = useConfirm();
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('all'),
    [sort, setSort] = useState('default'),
    [page, setPage] = useState(1),
    [renaming, setRenaming] = useState(false),
    [nameDraft, setNameDraft] = useState('');
  const filtered = useMemo(() => {
    const list = (templates.data || []).filter(
      (t) =>
        (category === 'all' || t.category === category) &&
        matchesSearch(`${t.title} ${t.category} ${t.output} ${t.description}`, search),
    );
    return sort === 'name' ? list.sort((a, b) => a.title.localeCompare(b.title, 'vi')) : list;
  }, [templates.data, category, search, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  if (page > pages) setPage(pages);
  const draft = editor.draft;
  if (editor.isPending || templates.isPending || !draft)
    return editor.error ? <ErrorState error={editor.error} /> : <Loading />;
  if (templates.error)
    return <ErrorState error={templates.error} retry={() => void templates.refetch()} />;
  if (draft.runId) return <Navigate to={`/runs/${draft.runId}`} replace />;
  const choose = async (template: PlanTemplate) => {
    if (editor.saving) return;
    if (draft.templateId === template.id && draft.tasks.length) {
      try {
        await editor.save(draft);
        navigate(`/cases/${id}/plan`);
      } catch {
        /* Retrying the same selection must still persist a failed save. */
      }
      return;
    }
    if (
      draft.tasks.length &&
      !(await confirm({
        title: 'Thay template hiện tại?',
        message:
          'Các task và phân công đã chỉnh sửa sẽ được thay bằng template mới. Tên, bối cảnh và tài liệu hồ sơ của case được giữ lại.',
        confirmLabel: 'Thay template',
      }))
    )
      return;
    const next: CaseDraft = {
      ...draft,
      method: 'template',
      templateId: template.id,
      wizardStep: 4,
      revision: draft.revision + 1,
      tasks: structuredClone(template.tasks),
      output: template.output,
      documents: [
        ...draft.documents.filter((d) => d.kind === 'case'),
        ...structuredClone(template.documents),
      ],
    };
    editor.replace(next);
    try {
      await editor.save(next);
      navigate(`/cases/${id}/plan`);
    } catch {
      /* Save feedback remains visible. */
    }
  };
  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setPage(1);
  };
  return (
    <>
      <BackLink to="/cases">Quay lại Cases</BackLink>
      <PageHeader
        eyebrow="DÙNG TEMPLATE"
        title="Chọn template"
        description={`Case: ${draft.title} · Chọn quy trình phù hợp để review plan và bắt đầu.`}
        action={
          <Button
            onClick={() => {
              setNameDraft(draft.title);
              setRenaming(true);
            }}
          >
            <Pencil size={14} />
            Đổi tên
          </Button>
        }
      />
      {editor.saveError && <ErrorState error={editor.saveError} />}
      <section aria-label="Thư viện template">
        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_160px]">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-3 text-n4" />
            <input
              id="template-search"
              aria-label="Tìm template"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tên, lĩnh vực hoặc đầu ra…"
              className="!pl-10"
            />
          </div>
          <select
            aria-label="Lĩnh vực template"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Tất cả lĩnh vực</option>
            {[...new Set(templates.data.map((t) => t.category))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Sắp xếp template"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="default">Mặc định</option>
            <option value="name">Tên A–Z</option>
          </select>
        </div>
        <div className="my-4 flex min-h-6 items-center justify-between text-xs text-n4">
          <span role="status">
            {filtered.length
              ? `${(page - 1) * 6 + 1}–${Math.min(page * 6, filtered.length)} trong ${filtered.length} template`
              : 'Không tìm thấy template phù hợp'}
          </span>
          {(search || category !== 'all') && filtered.length > 0 && (
            <button className="text-primary" onClick={resetFilters}>
              Xóa bộ lọc
            </button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.slice((page - 1) * 6, page * 6).map((template) => (
            <button
              key={template.id}
              onClick={() => void choose(template)}
              disabled={editor.saving}
              className="flex min-h-72 flex-col rounded-lg border border-n2 bg-n0 p-5 text-left hover:border-n3 disabled:cursor-wait disabled:opacity-50"
            >
              <div className="mb-4 flex items-center justify-between">
                <FileText size={20} className="text-info" />
                <Badge>{template.category}</Badge>
              </div>
              <h3 className="font-semibold leading-6">{template.title}</h3>
              <p className="my-3 text-sm text-n4">{template.description}</p>
              <p className="mt-auto text-xs text-n4">
                {template.tasks.length} tasks ·{' '}
                {new Set(template.tasks.flatMap((t) => t.expertIds)).size} experts · v
                {template.version}
              </p>
              <p className="mt-4 border-t border-n2 pt-3 text-xs text-n4">
                <strong className="mb-1 block font-semibold">Đầu ra</strong>
                {template.output}
              </p>
              <span className="mt-4 flex items-center justify-between border-t border-n2 pt-3 text-xs font-semibold text-primary">
                Dùng template
                <ArrowRight size={15} />
              </span>
            </button>
          ))}
        </div>
        {!filtered.length && (
          <div className="rounded-lg border border-dashed border-n3 p-12 text-center">
            <h3 className="font-semibold">Chưa có template phù hợp</h3>
            <p className="my-3 text-n4">Thử từ khóa khác hoặc xem lại tất cả lĩnh vực.</p>
            <Button onClick={resetFilters}>Xóa bộ lọc</Button>
          </div>
        )}
        {pages > 1 && (
          <nav aria-label="Trang template" className="my-6 flex justify-center gap-2">
            <Button
              aria-label="Trang trước"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ArrowLeft size={15} />
            </Button>
            {Array.from({ length: pages }, (_, i) => (
              <Button
                key={i}
                aria-current={page === i + 1 ? 'page' : undefined}
                variant={page === i + 1 ? 'soft' : 'secondary'}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              aria-label="Trang tiếp"
              disabled={page === pages}
              onClick={() => setPage(page + 1)}
            >
              <ArrowRight size={15} />
            </Button>
          </nav>
        )}
      </section>
      <Modal open={renaming} title="Đổi tên case" onClose={() => setRenaming(false)}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!nameDraft.trim()) return;
            const next = { ...draft, title: nameDraft.trim(), revision: draft.revision + 1 };
            editor.replace(next);
            void editor
              .save(next)
              .then(() => setRenaming(false))
              .catch(() => {});
          }}
        >
          <Field id="rename-case" label="Tên case" required>
            <input
              id="rename-case"
              required
              maxLength={120}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
            />
          </Field>
          {editor.saveError && <ErrorState error={editor.saveError} />}
          <div className="mt-6 flex justify-end">
            <Button type="submit" variant="primary" disabled={editor.saving || !nameDraft.trim()}>
              Lưu tên
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
