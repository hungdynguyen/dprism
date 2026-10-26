import * as api from '@/services/api';
import { sampleContext } from '@/mocks/fixtures';
describe('API boundary with MSW', () => {
  it('creates independent drafts and returns meaningful validation errors', async () => {
    await expect(api.createCase({ title: '   ' })).rejects.toMatchObject({ status: 400 });
    const a = await api.createCase({ title: 'Alpha' });
    await api.updateCase({ ...a, context: sampleContext, revision: 1 });
    const b = await api.createCase({ title: 'Beta' });
    expect(b.context.task).toBe('');
    expect(b.documents).toEqual([]);
    expect((await api.getCase(a.id)).context.task).toBe(sampleContext.task);
  });
  it('starts idempotently, freezes the plan, and shares the full snapshot', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const draft = await api.createCase({ title: 'AutoSupport' }),
      template = (await api.getTemplates())[0];
    await api.updateCase({
      ...draft,
      method: 'template',
      templateId: template.id,
      tasks: template.tasks,
      documents: template.documents,
      context: sampleContext,
      output: template.output,
      revision: 1,
    });
    const run = await api.startRun(draft.id);
    expect((await api.startRun(draft.id)).id).toBe(run.id);
    await expect(api.updateCase({ ...draft, revision: 2 })).rejects.toMatchObject({ status: 409 });
    vi.mocked(Date.now).mockReturnValue(14000);
    const finished = await api.getRun(run.id);
    expect(finished.status).toBe('COMPLETED');
    await api.shareRun({ id: run.id, shared: true });
    const publicCase = await api.getSharedCase(run.id);
    expect(publicCase.run.plan.tasks).toHaveLength(4);
    expect(publicCase.run.results).toHaveLength(4);
    expect(publicCase.run.experts[0].systemPrompt).toBeTruthy();
    await api.shareRun({ id: run.id, shared: false });
    await expect(api.getSharedCase(run.id)).rejects.toMatchObject({ status: 404 });
  });
});
