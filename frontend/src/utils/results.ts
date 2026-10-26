import type { Run } from '@/types';
export interface Argument {
  id: string;
  taskId: string;
  title: string;
  text: string;
  dissent: boolean;
  expertIds: string[];
}
export function buildArguments(run: Run): Argument[] {
  return run.results.flatMap((result) => [
    {
      id: result.taskId,
      taskId: result.taskId,
      title: result.title,
      text: result.summary,
      dissent: false,
      expertIds: result.views.map((v) => v.expertId),
    },
    ...result.disagreements.map((d, i) => ({
      id: `${result.taskId}-dissent-${i}`,
      taskId: result.taskId,
      title: d.aspect,
      text: d.resolutionNote,
      dissent: true,
      expertIds: [d.expertAId, d.expertBId],
    })),
  ]);
}
export function reportMarkdown(run: Run): string {
  return `# ${run.title}\n\nTrạng thái: ${run.status}\n${run.mock ? 'Dữ liệu mô phỏng; chưa gọi model.\n' : ''}${run.exitReason || ''}\n\n## Mục tiêu\n${run.plan.context.task}\n\n## Đầu ra yêu cầu\n${run.plan.output}\n\n${run.results.map((result) => `## ${result.taskId} — ${result.title}\n\n${result.summary}\n\n${result.views.map((v) => `### ${run.experts.find((e) => e.id === v.expertId)?.role || v.expertId}\n${v.text}\n${v.finalRating || ''}`).join('\n\n')}\n\n### Bất đồng\n${result.disagreements.map((d) => `${d.aspect}\n- ${d.expertAView}\n- ${d.expertBView}\n${d.resolutionNote}`).join('\n\n') || 'Không ghi nhận bất đồng.'}\n\n### Bằng chứng\n${result.evidence.map((e) => `- ${e.documentId} · ${e.section}: ${e.quote}`).join('\n') || 'Chưa có dẫn nguồn.'}`).join('\n\n')}\n\n## Trace\n${run.trace.map((t) => `- ${t.time}: ${t.title} — ${t.detail}`).join('\n')}\n`;
}
