import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Expert, Skill } from '@/types';
import { ExpertMark } from '@/components/ExpertMark';

export function ExpertCard({
  expert,
  skills,
  onChat,
  disabled = false,
  busy = false,
  profileReturnTo = '/experts',
}: Readonly<{
  expert: Expert;
  skills: Skill[];
  onChat: () => void;
  disabled?: boolean;
  busy?: boolean;
  profileReturnTo?: string;
}>) {
  const labels = skills.filter((skill) => expert.skillIds.includes(skill.id)).slice(0, 3);
  return (
    <article className="flex h-full flex-col rounded-xl border border-n2 bg-n0 p-5 transition-colors hover:border-n3 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <ExpertMark expert={expert} />
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-6">
            <Link
              to={`/experts/${expert.id}`}
              state={{ returnTo: profileReturnTo }}
              className="hover:text-primary hover:underline hover:underline-offset-4"
            >
              {expert.role}
            </Link>
          </h2>
          <p className="mt-1 text-xs text-n4">{expert.domain}</p>
        </div>
      </div>
      <p className="mb-5 line-clamp-3 text-sm leading-6 text-n4">{expert.approach}</p>
      <div className="mt-auto flex flex-wrap gap-2 pb-5">
        {labels.map((skill) => (
          <span key={skill.id} className="rounded-md bg-n1 px-2 py-1 text-xs text-n4">
            {skill.name}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onChat}
        disabled={disabled}
        className="inline-flex min-h-10 items-center gap-2 self-start rounded-md py-2 text-sm font-semibold text-primary underline-offset-4 transition-colors enabled:hover:text-primary-deep enabled:hover:underline disabled:cursor-not-allowed disabled:opacity-45"
        aria-label={`Trao đổi riêng với ${expert.role}`}
      >
        {busy ? 'Đang mở…' : 'Trao đổi riêng'}
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </article>
  );
}
