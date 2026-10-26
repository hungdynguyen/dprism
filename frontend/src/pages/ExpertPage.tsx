import { Link, useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, Pencil } from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { useExpert, useSkills } from '@/hooks/useExperts';
import { useChatStore } from '@/hooks/useChatStore';
import { BackLink, PageHeader } from '@/components/PageHeader';
import { ExpertMark } from '@/components/ExpertMark';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ErrorState, Loading } from '@/components/AsyncState';
export function ExpertPage() {
  const { id = '' } = useParams(),
    expert = useExpert(id),
    skills = useSkills(),
    start = useChatStore((s) => s.start),
    navigate = useNavigate();
  if (expert.isPending || skills.isPending) return <Loading />;
  if (expert.error || skills.error) return <ErrorState error={expert.error || skills.error} />;
  const item = expert.data;
  return (
    <>
      <BackLink to="/experts">Quay lại danh sách expert</BackLink>
      <PageHeader
        eyebrow="HỒ SƠ CHUYÊN MÔN"
        title={item.role}
        action={
          <Link
            to={`/experts/${id}/edit`}
            className="inline-flex items-center gap-2 rounded-md border border-n2 bg-n0 px-4 py-2"
          >
            <Pencil size={15} />
            Chỉnh sửa
          </Link>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <div className="space-y-5">
          <Card>
            <div className="mb-6 flex items-center gap-4">
              <ExpertMark expert={item} />
              <div>
                <h2 className="font-semibold">{item.role}</h2>
                <p className="text-xs text-n4">{item.domain}</p>
              </div>
            </div>
            <h3 className="section-title">Cách đánh giá</h3>
            <p className="mt-3 text-n4">{item.approach}</p>
            <Button
              variant="primary"
              className="mt-6"
              onClick={() => navigate(`/chats/${start({ expert: item })}`)}
            >
              <MessageSquare size={16} />
              Trao đổi riêng
            </Button>
          </Card>
          <Card>
            <h3 className="section-title">System instructions</h3>
            <pre className="mt-4 whitespace-pre-wrap break-words rounded-md bg-n1 p-4 text-sm leading-7 text-n5">
              {item.systemPrompt || 'Chưa có chỉ dẫn bổ sung.'}
            </pre>
          </Card>
        </div>
        <Card>
          <h2 className="mb-4 font-semibold">Kỹ năng chuyên môn</h2>
          {skills.data
            .filter((s) => item.skillIds.includes(s.id))
            .map((skill) => (
              <details key={skill.id} className="border-t border-n2 py-4">
                <summary className="cursor-pointer font-medium">{skill.name}</summary>
                <article className="prose mt-4">
                  <Markdown>{skill.content}</Markdown>
                </article>
              </details>
            ))}
          {!item.skillIds.length && <p className="text-n4">Chưa gắn kỹ năng.</p>}
          <p className="helper mt-5">
            Knowledge Base chưa triển khai. Tài liệu được gán theo từng case và task.
          </p>
        </Card>
      </div>
    </>
  );
}
