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
  const run = simulateRun(createMockRun(plan, experts, skills, Date.now() - 86400000), Date.now());
  run.shared = true;
  return {
    version: 1,
    experts: structuredClone(experts),
    templates: structuredClone(templateFixtures),
    cases: [],
    runs: [],
    shared: [
      {
        id: 'shared-autosupport',
        title: plan.title,
        owner: 'Nhóm AI Governance',
        summary: 'Hồ sơ mẫu về ranh giới chỉ dẫn, dữ liệu và quyền truy cập công cụ.',
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        run,
      },
    ],
  };
}
function read(): MockDatabase {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null') as MockDatabase | null;
    if (value?.version === 1 && Array.isArray(value.experts) && Array.isArray(value.cases))
      return value;
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
