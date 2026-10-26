import type { RunStatus, TaskStatus } from '@/utils/runStatus';
export type { RunStatus, TaskStatus, Tone } from '@/utils/runStatus';

export interface User {
  id: string;
  name: string;
  capabilities: { appEnabled: boolean };
}
export interface Skill {
  id: string;
  name: string;
  description: string;
  content: string;
}
export interface Expert {
  id: string;
  role: string;
  domain: string;
  approach: string;
  systemPrompt: string;
  skillIds: string[];
}
export type ExpertInput = Omit<Expert, 'id'>;
export interface PlanDocument {
  id: string;
  name: string;
  kind: 'reference' | 'case';
  content: string;
  status: 'ready' | 'metadata-only';
  size?: number;
  mime?: string;
}
export interface Task {
  id: string;
  title: string;
  dependsOn: string[];
  expertIds: string[];
  instruction: string;
  output: string;
  documentIds: string[];
  reviewMode: 'cross' | 'single';
  maxRounds: number;
  tokenBudget: number;
}
export interface CaseContext {
  situation: string;
  task: string;
  action: string;
  result: string;
}
export type CaseMethod = 'template' | 'open' | 'direct';
export interface CaseDraft {
  id: string;
  title: string;
  method: CaseMethod | null;
  templateId: string | null;
  context: CaseContext;
  output: string;
  tasks: Task[];
  documents: PlanDocument[];
  referenceCaseIds: string[];
  wizardStep: number;
  revision: number;
  updatedAt: string;
  runId: string | null;
  chatId: string | null;
  runStatus?: RunStatus;
}
export interface PlanTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  version: string;
  output: string;
  tasks: Task[];
  documents: PlanDocument[];
}
export type Rating = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export interface Evidence {
  documentId: string;
  section: string;
  quote: string;
}
export interface ExpertView {
  expertId: string;
  initialRating?: Rating;
  finalRating?: Rating;
  text: string;
}
export interface Disagreement {
  aspect: string;
  expertAId: string;
  expertAView: string;
  expertBId: string;
  expertBView: string;
  resolutionNote: string;
}
export interface TaskResult {
  taskId: string;
  title: string;
  summary: string;
  rating?: Rating;
  views: ExpertView[];
  evidence: Evidence[];
  disagreements: Disagreement[];
  upstreamBrief: string;
  mock: boolean;
}
export interface TraceEvent {
  id: string;
  time: string;
  taskId?: string;
  type: string;
  title: string;
  detail: string;
}
export interface Run {
  id: string;
  caseId: string;
  title: string;
  status: RunStatus;
  startedAt: string;
  finishedAt: string | null;
  plan: CaseDraft;
  experts: Expert[];
  skills: Skill[];
  taskStates: Record<string, TaskStatus>;
  activeTaskId: string | null;
  results: TaskResult[];
  trace: TraceEvent[];
  exitReason: string | null;
  shared: boolean;
  mock: boolean;
}
export interface SharedCase {
  id: string;
  title: string;
  owner: string;
  ownerId: string;
  visibility: 'public' | 'restricted';
  recipientIds: string[];
  domain: string;
  tags: string[];
  decisionType: string;
  summary: string;
  publishedAt: string;
  run: Run;
}
export type CaseCollection = 'all' | 'received' | 'public';
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  mock?: boolean;
  failed?: boolean;
}
export interface Conversation {
  id: string;
  title: string;
  expert: Expert;
  caseId: string | null;
  returnTo: string;
  messages: ChatMessage[];
  updatedAt: string;
}
export interface ValidationIssue {
  field: string;
  message: string;
  taskId?: string;
}
