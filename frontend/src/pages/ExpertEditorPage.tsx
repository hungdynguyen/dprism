import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateExpert, useExpert, useSkills, useUpdateExpert } from '@/hooks/useExperts';
import type { ExpertInput, Skill } from '@/types';
import { BackLink, PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { Button } from '@/components/Button';
import { ErrorState, Loading } from '@/components/AsyncState';
import { useAuth } from '@/hooks/useAuth';
import { clearRecovery, readExpertRecovery, writeRecovery } from '@/utils/draftStorage';
function ExpertForm({
  initial,
  skills,
  id,
}: Readonly<{ initial: ExpertInput; skills: Skill[]; id?: string }>) {
  const auth = useAuth(),
    storageKey = `dprism.expert-draft:${auth.data?.id || 'user'}:${id || 'new'}`;
  const [draft, setDraft] = useState(() => readExpertRecovery(storageKey, initial)),
    create = useCreateExpert(),
    update = useUpdateExpert(),
    navigate = useNavigate(),
    mutation = id ? update : create;
  useEffect(() => writeRecovery(storageKey, draft), [storageKey, draft]);
  const change = (key: keyof ExpertInput, value: string | string[]) =>
    setDraft((old) => ({ ...old, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const data = {
        ...draft,
        role: draft.role.trim(),
        domain: draft.domain.trim() || 'General',
        approach: draft.approach.trim(),
      };
      const expert = id ? await update.mutateAsync({ id, data }) : await create.mutateAsync(data);
      clearRecovery(storageKey);
      navigate(`/experts/${expert.id}`);
    } catch {
      /* Mutation feedback is rendered below. */
    }
  };
  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]"
    >
      <Card className="space-y-5">
        <Field id="expert-role" label="Vai trò chuyên môn" required>
          <input
            id="expert-role"
            required
            maxLength={120}
            value={draft.role}
            onChange={(e) => change('role', e.target.value)}
            placeholder="Ví dụ: Model Risk Expert"
          />
        </Field>
        <Field id="expert-domain" label="Lĩnh vực">
          <input
            id="expert-domain"
            value={draft.domain}
            onChange={(e) => change('domain', e.target.value)}
            list="expert-domains"
          />
          <datalist id="expert-domains">
            {['AI & Data', 'Security', 'Compliance', 'Operations', 'Synthesis'].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </datalist>
        </Field>
        <Field id="expert-approach" label="Cách đánh giá" required>
          <textarea
            id="expert-approach"
            required
            value={draft.approach}
            onChange={(e) => change('approach', e.target.value)}
          />
        </Field>
        <Field id="expert-system" label="System instructions">
          <textarea
            id="expert-system"
            className="min-h-48 font-mono"
            value={draft.systemPrompt}
            onChange={(e) => change('systemPrompt', e.target.value)}
          />
        </Field>
      </Card>
      <div className="space-y-5">
        <Card>
          <h2 className="mb-3 font-semibold">Kỹ năng chuyên môn</h2>
          {skills.map((skill) => (
            <div key={skill.id} className="border-t border-n2 py-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={draft.skillIds.includes(skill.id)}
                  onChange={(e) =>
                    change(
                      'skillIds',
                      e.target.checked
                        ? [...draft.skillIds, skill.id]
                        : draft.skillIds.filter((s) => s !== skill.id),
                    )
                  }
                />
                {skill.name}
              </label>
              <details className="ml-7 mt-2 text-xs text-n4">
                <summary className="cursor-pointer">Đọc SKILL.md</summary>
                <pre className="mt-3 whitespace-pre-wrap leading-6">{skill.content}</pre>
              </details>
            </div>
          ))}
        </Card>
        {mutation.error && <ErrorState error={mutation.error} />}
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => {
              clearRecovery(storageKey);
              navigate(id ? `/experts/${id}` : '/experts');
            }}
          >
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang lưu…' : id ? 'Lưu thay đổi' : 'Tạo expert'}
          </Button>
        </div>
      </div>
    </form>
  );
}
export function ExpertEditorPage() {
  const { id } = useParams(),
    query = useExpert(id || ''),
    skills = useSkills();
  if (skills.isPending || (id && query.isPending)) return <Loading />;
  if (skills.error || query.error) return <ErrorState error={skills.error || query.error} />;
  return (
    <>
      <BackLink to={id ? `/experts/${id}` : '/experts'}>
        Quay lại {id ? 'hồ sơ expert' : 'danh sách expert'}
      </BackLink>
      <PageHeader
        title={id ? 'Điều chỉnh chuyên gia AI' : 'Tạo chuyên gia AI'}
        description="Định nghĩa một vai trò chuyên môn. Danh tính cá nhân không bắt buộc."
      />
      <ExpertForm
        key={id || 'new'}
        id={id}
        initial={
          query.data || {
            role: '',
            domain: 'AI & Data',
            approach: '',
            systemPrompt: '',
            skillIds: [],
          }
        }
        skills={skills.data}
      />
    </>
  );
}
