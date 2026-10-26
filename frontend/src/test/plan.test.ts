import { blankCase } from '@/mocks/database';
import { experts, riskTasks, sampleContext, skills } from '@/mocks/fixtures';
import { createMockRun, simulateRun } from '@/mocks/execution';
import { graphLayout, nextTask, topologicalTasks, validateCase } from '@/utils/plan';
import { buildArguments } from '@/utils/results';
import { matchesSearch } from '@/utils/format';
const draft = () => ({
  ...blankCase('AutoSupport'),
  context: sampleContext,
  output: 'Bảng rủi ro.',
  templateId: 'ai-risk',
  tasks: riskTasks(),
});
describe('Plan invariants', () => {
  it('rejects cycles and missing dependencies before execution', () => {
    const input = draft();
    input.tasks[0].dependsOn = ['C4'];
    expect(topologicalTasks(input.tasks)).toHaveLength(0);
    expect(validateCase(input).some((e) => e.field === 'task-dependencies')).toBe(true);
    input.tasks[0].dependsOn = ['missing'];
    expect(validateCase(input).find((e) => e.taskId === 'C1')?.message).toContain('thiếu');
  });
  it('validates exchange and budget boundaries and keeps DAG layout horizontal', () => {
    const input = draft();
    expect(validateCase(input)).toEqual([]);
    input.tasks[0].maxRounds = 0;
    input.tasks[1].tokenBudget = 50;
    expect(validateCase(input).map((e) => e.field)).toEqual(
      expect.arrayContaining(['task-rounds', 'task-budget']),
    );
    const layout = graphLayout(input.tasks);
    expect(layout.nodes.find((n) => n.task.id === 'C4')!.x).toBeGreaterThan(layout.nodes[0].x);
  });
  it('commits each task at three seconds and preserves disagreement even with equal ratings', () => {
    const input = draft(),
      run = createMockRun(input, experts, skills, 1000);
    expect(simulateRun(run, 3999).results).toHaveLength(0);
    expect(simulateRun(run, 4000).results).toHaveLength(1);
    const complete = simulateRun(run, 13000);
    expect(complete.status).toBe('COMPLETED');
    expect(complete.results).toHaveLength(4);
    const c3 = complete.results.find((r) => r.taskId === 'C3')!;
    expect(new Set(c3.views.map((v) => v.finalRating)).size).toBe(1);
    expect(c3.disagreements.length).toBeGreaterThan(0);
    expect(buildArguments(complete).filter((a) => a.dissent).length).toBeGreaterThan(0);
    input.tasks[0].title = 'Changed later';
    expect(run.plan.tasks[0].title).not.toBe('Changed later');
  });
  it('keeps partial artifacts and stops downstream tasks on a mock budget exit', () => {
    const input = draft();
    input.tasks[2].tokenBudget = 500;
    const run = simulateRun(createMockRun(input, experts, skills, 1000), 13000);
    expect(run.status).toBe('INCOMPLETE');
    expect(run.results.map((r) => r.taskId)).toEqual(['C1', 'C2']);
    expect(run.taskStates.C3).toBe('FAILED');
    expect(run.taskStates.C4).toBe('SKIPPED');
    expect(run.exitReason).toContain('1.000');
  });
  it('matches Vietnamese skills without accents, including capital Đ', () => {
    expect(matchesSearch('Đánh giá rủi ro AI', 'danh gia rui ro')).toBe(true);
  });
  it('does not reuse the identity of a task that can still be restored with Undo', () => {
    const tasks = riskTasks().filter((t) => t.id !== 'C2');
    expect(nextTask(tasks, ['C2']).id).toBe('C5');
  });
});
