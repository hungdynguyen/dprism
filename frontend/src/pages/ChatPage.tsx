import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUp, RotateCcw } from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { useConversation } from '@/hooks/useConversation';
import { ExpertMark } from '@/components/ExpertMark';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { apiErrorMessage } from '@/utils/apiError';
export function ChatPage() {
  const { id = '' } = useParams(),
    { conversation, send, retry, pending, error } = useConversation(id),
    [input, setInput] = useState(''),
    transcript = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: 'auto' });
  }, [conversation?.messages.length, pending]);
  if (!conversation)
    return (
      <Card>
        <h1 className="text-xl font-semibold">Không tìm thấy cuộc trao đổi</h1>
        <p className="my-3 text-n4">Hội thoại chỉ được lưu trên trình duyệt này.</p>
        <Link to="/experts" className="text-primary underline">
          Chọn chuyên gia
        </Link>
      </Card>
    );
  const submit = () => {
    if (!input.trim() || pending) return;
    send(input);
    setInput('');
  };
  const failed = conversation.messages.at(-1)?.failed;
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-160px)] max-w-[1200px] flex-col">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ExpertMark expert={conversation.expert} />
          <div>
            <p className="text-xs text-n4">Trao đổi riêng · {conversation.expert.role}</p>
            <h1 className="mt-1 text-xl font-semibold">{conversation.title}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-medium text-n4">
          <Link to={conversation.returnTo} className="flex items-center gap-2">
            <ArrowLeft size={14} />
            {conversation.caseId ? 'Quay lại case' : 'Danh sách expert'}
          </Link>
          <Link
            to={
              conversation.caseId
                ? `/cases/${conversation.caseId}/experts`
                : '/experts/select?returnTo=/experts'
            }
          >
            Chọn expert khác
          </Link>
        </div>
      </header>
      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="flex min-h-[550px] flex-col overflow-hidden rounded-xl border border-n2 bg-n0">
          <div
            ref={transcript}
            role="log"
            aria-live="polite"
            aria-label="Nội dung trao đổi"
            className="max-h-[60dvh] flex-1 space-y-5 overflow-y-auto p-5 sm:p-7"
          >
            {!conversation.messages.length && (
              <div className="py-8">
                <h2 className="text-xl font-semibold">Bạn muốn làm rõ điều gì?</h2>
                <p className="mt-3 text-n4">{conversation.expert.approach}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    'Các rủi ro quan trọng của AutoSupport là gì?',
                    'Tôi nên chuẩn bị bằng chứng nào?',
                    'Gợi ý cách giảm thiểu rủi ro.',
                  ].map((question) => (
                    <button
                      key={question}
                      onClick={() => setInput(question)}
                      className="rounded-lg border border-n2 px-3 py-2 text-left text-xs text-n4 hover:bg-n1"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {conversation.messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[92%] ${message.role === 'user' ? 'ml-auto' : ''}`}
              >
                <p className="mb-2 text-xs font-semibold text-n4">
                  {message.role === 'user' ? 'Bạn' : conversation.expert.role}
                  {message.mock && <span className="ml-2 font-normal">· Phản hồi mô phỏng</span>}
                </p>
                <div
                  className={`prose rounded-lg px-4 py-2 ${message.role === 'user' ? 'bg-tint-1' : 'bg-n1'}`}
                >
                  <Markdown>{message.content}</Markdown>
                </div>
                {message.failed && (
                  <p className="mt-2 text-xs text-primary">Chưa gửi thành công.</p>
                )}
              </article>
            ))}
            {pending && (
              <p role="status" className="text-sm text-n4">
                {conversation.expert.role} đang trả lời…
              </p>
            )}
          </div>
          {error && (
            <div role="alert" className="border-t border-n2 px-5 py-3 text-xs text-primary">
              {apiErrorMessage(error)}{' '}
              {failed && (
                <button className="ml-2 inline-flex items-center gap-1 underline" onClick={retry}>
                  <RotateCcw size={12} />
                  Thử lại
                </button>
              )}
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="border-t border-n2 p-4"
          >
            <label htmlFor="chat-input" className="sr-only">
              Tin nhắn cho expert
            </label>
            <textarea
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={8000}
              placeholder={`Đặt câu hỏi cho ${conversation.expert.role}…`}
              className="!min-h-20 !border-transparent"
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  (event.ctrlKey || event.metaKey) &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  submit();
                }
              }}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-n4">Chỉ một expert tham gia · Ctrl + Enter để gửi</p>
              <Button
                type="submit"
                variant="primary"
                disabled={pending || !input.trim() || !!failed}
                aria-label="Gửi tin nhắn"
              >
                <ArrowUp size={17} />
                Gửi
              </Button>
            </div>
          </form>
        </section>
        <aside className="hidden space-y-5 lg:block">
          <Card>
            <h2 className="font-semibold">{conversation.expert.role}</h2>
            <p className="helper mt-2">{conversation.expert.domain}</p>
            <h3 className="section-title mt-6">Cách đánh giá</h3>
            <p className="mt-2 text-sm text-n4">{conversation.expert.approach}</p>
            <details className="mt-5 border-t border-n2 pt-4">
              <summary className="cursor-pointer text-sm font-semibold">
                System instructions
              </summary>
              <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-n4">
                {conversation.expert.systemPrompt}
              </pre>
            </details>
          </Card>
          <p className="helper px-1">
            Lịch sử được lưu trên trình duyệt này. Knowledge Base chưa triển khai.
          </p>
        </aside>
      </div>
    </div>
  );
}
