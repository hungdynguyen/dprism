import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUp, RotateCcw } from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { useConversation } from '@/hooks/useConversation';
import { Card } from '@/components/Card';
import { apiErrorMessage } from '@/utils/apiError';

export function ChatPage() {
  const { id = '' } = useParams();
  const { conversation, send, retry, pending, error } = useConversation(id);
  const [input, setInput] = useState('');
  const transcript = useRef<HTMLDivElement>(null),
    composer = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: 'auto' });
  }, [conversation?.messages.length, pending]);
  useEffect(() => {
    const element = composer.current;
    if (element) {
      element.style.height = 'auto';
      element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
    }
  }, [input]);
  if (!conversation)
    return (
      <Card>
        <h1 className="text-xl font-semibold">Không tìm thấy cuộc trao đổi</h1>
        <p className="my-3 text-n4">Hội thoại chỉ được lưu trên trình duyệt này.</p>
        <Link to="/cases?tab=chats" className="text-primary underline">
          Về danh sách trao đổi
        </Link>
      </Card>
    );
  const failed = conversation.messages.at(-1)?.failed;
  const submit = () => {
    if (!input.trim() || pending || failed) return;
    send(input);
    setInput('');
    composer.current?.focus();
  };
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-n2 pb-4 sm:gap-5">
        <Link
          to={conversation.returnTo}
          aria-label="Quay lại danh sách trao đổi"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-n4 hover:bg-n2/40"
        >
          <ArrowLeft size={19} />
        </Link>
        <div className="min-w-0">
          <h1 title={conversation.title} className="truncate text-base font-semibold">
            {conversation.title}
          </h1>
          <p className="truncate text-xs text-n4">{conversation.expert.role}</p>
        </div>
      </header>
      <div
        ref={transcript}
        role="log"
        aria-live="polite"
        aria-label="Nội dung trao đổi"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div
          className={`mx-auto flex min-h-full w-full max-w-3xl flex-col px-1 py-6 sm:px-4 sm:py-10 ${conversation.messages.length ? 'gap-8' : 'justify-center'}`}
        >
          {!conversation.messages.length && (
            <div className="pb-8 text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Bạn muốn trao đổi điều gì?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-n4">
                Chia sẻ vấn đề hoặc đặt câu hỏi để bắt đầu.
              </p>
            </div>
          )}
          {conversation.messages.map((message) => (
            <article
              key={message.id}
              aria-label={message.role === 'user' ? 'Bạn' : conversation.expert.role}
              className={
                message.role === 'user' ? 'ml-auto max-w-[88%] sm:max-w-[80%]' : 'w-full min-w-0'
              }
            >
              <div
                className={`prose min-w-0 break-words [overflow-wrap:anywhere] ${message.role === 'user' ? 'rounded-3xl bg-n2/50 px-5 py-1 [&_p]:my-2' : ''}`}
              >
                <Markdown>{message.content}</Markdown>
              </div>
              {message.mock && <p className="mt-2 text-[11px] text-n4">Phản hồi mô phỏng</p>}
              {message.failed && <p className="mt-2 text-xs text-primary">Chưa gửi thành công.</p>}
            </article>
          ))}
          {pending && (
            <p role="status" className="flex items-center gap-2 text-sm text-n4">
              <span className="h-2 w-2 rounded-full bg-n4 motion-safe:animate-pulse" />
              Đang trả lời…
            </p>
          )}
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl shrink-0 pt-3 sm:px-4">
        {(error || failed) && (
          <div role="alert" className="mb-3 rounded-lg bg-tint-1 px-4 py-3 text-xs text-primary">
            {error ? apiErrorMessage(error) : 'Tin nhắn chưa nhận được phản hồi.'}
            {failed && (
              <button
                disabled={pending}
                className="ml-3 inline-flex items-center gap-1 underline disabled:opacity-50"
                onClick={retry}
              >
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
          className="rounded-3xl border border-n3/70 bg-n0 p-3 shadow-sm focus-within:border-n4"
        >
          <label htmlFor="chat-input" className="sr-only">
            Tin nhắn cho expert
          </label>
          <textarea
            ref={composer}
            id="chat-input"
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={8000}
            placeholder="Nhập tin nhắn…"
            className="!min-h-12 !resize-none !rounded-xl !border-0 !bg-transparent !px-3 !py-2 !shadow-none !ring-0"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <div className="flex items-center justify-between gap-3 pl-3">
            <span className="text-[11px] text-n4">Shift + Enter để xuống dòng</span>
            <button
              type="submit"
              disabled={pending || !input.trim() || !!failed}
              aria-label="Gửi tin nhắn"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-n6 text-n0 transition-colors hover:bg-n5 disabled:cursor-not-allowed disabled:bg-n2 disabled:text-n4"
            >
              <ArrowUp size={19} />
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-[11px] leading-5 text-n4">
          Lịch sử được lưu trên trình duyệt này.
        </p>
      </div>
    </section>
  );
}
