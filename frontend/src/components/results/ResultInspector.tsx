import { useState } from 'react';
import { FileText } from 'lucide-react';
import type { PlanDocument, Run, TaskResult } from '@/types';
import { ExpertMark } from '@/components/ExpertMark';
import { DocumentPreview } from '@/components/plan/Documents';
import { Badge } from '@/components/Badge';
export function ResultInspector({ result, run }: Readonly<{ result?: TaskResult; run: Run }>) {
  const [document, setDocument] = useState<PlanDocument | null>(null);
  if (!result)
    return <div className="p-5 text-sm text-n4">Chọn một luận điểm để xem chi tiết.</div>;
  return (
    <>
      <div className="space-y-6 p-5">
        <div>
          <p className="mb-2 text-xs text-n4">Luận điểm được chọn · {result.taskId}</p>
          <h2 className="text-lg font-semibold leading-7">{result.title}</h2>
          {result.rating && (
            <div className="mt-3">
              <Badge
                tone={
                  result.rating === 'HIGH' || result.rating === 'CRITICAL' ? 'warning' : 'neutral'
                }
              >
                {result.rating}
              </Badge>
            </div>
          )}
          <p className="mt-3 text-sm text-n4">{result.summary}</p>
        </div>
        <section>
          <h3 className="section-title">Quan điểm chuyên gia</h3>
          {result.views.map((view) => {
            const expert = run.experts.find((e) => e.id === view.expertId);
            return (
              <article key={view.expertId} className="mt-4 border-b border-n2 pb-4">
                <div className="mb-3 flex items-center gap-2">
                  {expert && <ExpertMark expert={expert} small />}
                  <div>
                    <strong className="text-xs font-semibold">
                      {expert?.role || view.expertId}
                    </strong>
                    <p className="text-xs text-n4">{view.finalRating || 'Đầu ra theo plan'}</p>
                  </div>
                </div>
                <p className="text-sm text-n4">{view.text}</p>
                {view.initialRating && (
                  <p className="helper mt-2">
                    Đánh giá đầu: {view.initialRating} → Sau phản biện: {view.finalRating}
                  </p>
                )}
              </article>
            );
          })}
        </section>
        <section>
          <h3 className="section-title">Bất đồng & giới hạn</h3>
          {result.disagreements.length ? (
            result.disagreements.map((d, i) => (
              <div
                key={i}
                className="mt-3 rounded-md bg-warning-soft p-3 text-xs leading-6 text-warning"
              >
                <strong>{d.aspect}</strong>
                <p className="mt-2 leading-6">{d.expertAView}</p>
                <p className="leading-6">{d.expertBView}</p>
                <p className="mt-2 leading-6">{d.resolutionNote}</p>
              </div>
            ))
          ) : (
            <p className="helper mt-2">
              Không ghi nhận bất đồng. Điều này không đồng nghĩa kết quả đã được phê duyệt.
            </p>
          )}
        </section>
        <section>
          <h3 className="section-title mb-3">Nguồn tham khảo</h3>
          {result.evidence.map((e, i) => {
            const doc = run.plan.documents.find((d) => d.id === e.documentId);
            return (
              <button
                key={i}
                disabled={!doc}
                onClick={() => setDocument(doc || null)}
                className="mb-3 flex w-full gap-2 rounded border border-n2 p-3 text-left hover:bg-n1"
              >
                <FileText size={15} className="mt-1 shrink-0 text-n4" />
                <span className="text-xs leading-6">
                  <strong className="font-medium">{doc?.name || e.documentId}</strong>
                  <span className="block text-n4">
                    {e.section} · “{e.quote}”
                  </span>
                </span>
              </button>
            );
          })}
          {!result.evidence.length && <p className="helper">Chưa có dẫn nguồn cho cấu hình này.</p>}
        </section>
        <details className="border-t border-n2 pt-4">
          <summary className="cursor-pointer text-xs font-semibold">Upstream brief</summary>
          <pre className="mt-3 whitespace-pre-wrap break-words rounded bg-n1 p-3 text-xs leading-6">
            {result.upstreamBrief}
          </pre>
        </details>
      </div>
      <DocumentPreview document={document} onClose={() => setDocument(null)} />
    </>
  );
}
