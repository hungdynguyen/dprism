import type { CaseDraft, Expert, PlanTemplate, Run, SharedCase } from '@/types';
import {
  experts,
  referenceDocuments,
  riskTasks,
  sampleContext,
  sampleDocument,
  skills,
  templateFixtures,
} from '@/mocks/fixtures';
import { createMockRun, simulateRun } from '@/mocks/execution';
import { catalogSeeds } from '@/mocks/catalog';

export const MOCK_USER_ID = 'tran';

interface MockDatabase {
  version: 1;
  experts: Expert[];
  templates: PlanTemplate[];
  cases: CaseDraft[];
  runs: Run[];
  shared: SharedCase[];
}
const KEY = 'dprism.mock-api.v1';
export function blankCase(title: string): CaseDraft {
  return {
    id: `case-${crypto.randomUUID()}`,
    title,
    method: null,
    templateId: null,
    context: { situation: '', task: '', action: '', result: '' },
    output: '',
    tasks: [],
    documents: [],
    referenceCaseIds: [],
    wizardStep: 1,
    revision: 0,
    updatedAt: new Date().toISOString(),
    runId: null,
    chatId: null,
  };
}
function seed(): MockDatabase {
  const plan = {
    ...blankCase('AutoSupport · Đánh giá trước pilot'),
    method: 'template' as const,
    templateId: 'ai-risk',
    context: sampleContext,
    output: 'Bảng rủi ro, bằng chứng, bất đồng và biện pháp giảm thiểu.',
    tasks: riskTasks(),
    documents: [sampleDocument, ...referenceDocuments],
  };
  const shared: SharedCase[] = catalogSeeds.map((entry) => {
    const publishedAt = new Date(Date.now() - entry.daysAgo * 86400000).toISOString();
    const snapshotPlan = structuredClone(plan);
    snapshotPlan.id = `case-${entry.id}`;
    snapshotPlan.title = entry.title;
    snapshotPlan.context.task = entry.summary;
    const taskIds =
      entry.domain === 'Bảo mật'
        ? ['C1', 'C3', 'C4']
        : entry.domain === 'Dữ liệu & AI'
          ? ['C2', 'C4']
          : entry.domain === 'Vận hành'
            ? ['C3', 'C4']
            : ['C1', 'C2', 'C3', 'C4'];
    snapshotPlan.tasks = snapshotPlan.tasks
      .filter((task) => taskIds.includes(task.id))
      .map((task) => ({ ...task, dependsOn: task.dependsOn.filter((id) => taskIds.includes(id)) }));
    const run = simulateRun(
      createMockRun(snapshotPlan, experts, skills, Date.parse(publishedAt) - 20000),
      Date.parse(publishedAt),
    );
    run.shared = entry.visibility === 'public';
    return {
      id: entry.id,
      title: entry.title,
      owner: entry.owner,
      ownerId: `owner-${entry.id}`,
      visibility: entry.visibility,
      recipientIds: entry.visibility === 'restricted' ? [MOCK_USER_ID] : [],
      domain: entry.domain,
      tags: [...entry.tags],
      decisionType: entry.decisionType,
      summary: entry.summary,
      publishedAt,
      run,
    };
  });
  return {
    version: 1,
    experts: structuredClone(experts),
    templates: structuredClone(templateFixtures),
    cases: [],
    runs: [],
    shared,
  };
}
function read(): MockDatabase {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null') as MockDatabase | null;
    if (value?.version === 1 && Array.isArray(value.experts) && Array.isArray(value.cases)) {
      const defaults = seed().shared;
      value.shared = (value.shared || []).map((item) => ({
        ...item,
        ownerId: item.ownerId || (item.owner === 'Tran' ? MOCK_USER_ID : `owner-${item.id}`),
        visibility: item.visibility || 'public',
        recipientIds: item.recipientIds || [],
        domain: item.domain || 'Ngân hàng',
        tags: item.tags || ['AI', 'Risk Management'],
        decisionType: item.decisionType || 'Thẩm định rủi ro',
      }));
      // Upgrade existing dev storage without replacing user-created drafts or runs.
      for (const entry of defaults)
        if (!value.shared.some((item) => item.id === entry.id)) value.shared.push(entry);
      return value;
    }
  } catch {
    /* Invalid dev fixtures are safely reseeded. */
  }
  return seed();
}
export let db = read();
export function persistMockDatabase() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* Storage quota does not prevent an in-memory demo. */
  }
}
export function resetMockDatabase() {
  db = seed();
  localStorage.removeItem(KEY);
}
