import {
  ArrowRight,
  BookOpen,
  GitFork,
  Lightbulb,
  ListChecks,
  MessageSquare,
  Network,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
export function HomePage() {
  const { data } = useAuth();
  const choices = [
    {
      to: '/experts',
      icon: BookOpen,
      title: 'Khám phá chuyên gia AI',
      description:
        'Tìm chuyên gia phù hợp, khám phá cách tiếp cận và trao đổi riêng về vấn đề của bạn.',
      action: 'Khám phá chuyên gia',
      orange: false,
      features: [
        [Users, 'Tìm chuyên gia theo lĩnh vực'],
        [BookOpen, 'Khám phá hồ sơ và kỹ năng'],
        [MessageSquare, 'Xem hồ sơ và trao đổi riêng'],
      ] as const,
    },
    {
      to: '/cases',
      icon: Lightbulb,
      title: 'Cùng expert giải quyết vấn đề',
      description:
        'Kết hợp các góc nhìn chuyên môn theo một plan rõ ràng, với kết quả có thể truy nguồn.',
      action: 'Khám phá & tạo case',
      orange: true,
      features: [
        [ListChecks, 'Chọn template hoặc tạo plan riêng'],
        [Users, 'Phân công expert cho từng task'],
        [Network, 'Xem kết quả, bất đồng và bằng chứng'],
      ] as const,
    },
  ];
  return (
    <div className="mx-auto max-w-[820px] pb-8 pt-6 sm:pt-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Chào {data?.name}!</h1>
        <p className="mt-2 text-lg text-n5">Hôm nay bạn muốn làm gì?</p>
        <p className="mt-2 text-sm text-n4">Chọn cách bắt đầu phù hợp với mục tiêu của bạn.</p>
      </header>
      <div className="grid gap-5 sm:grid-cols-2">
        {choices.map((choice) => (
          <article
            key={choice.to}
            className="flex min-h-[400px] flex-col rounded-xl border border-n2 bg-n0 p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${choice.orange ? 'bg-orange-soft text-orange' : 'bg-tint-1 text-primary'}`}
              >
                <choice.icon size={26} strokeWidth={1.6} />
              </span>
              <Link
                to={choice.to}
                aria-label={choice.title}
                className={`grid h-9 w-9 place-items-center rounded-full ${choice.orange ? 'bg-orange-soft text-orange' : 'bg-tint-1 text-primary'}`}
              >
                <ArrowRight size={17} />
              </Link>
            </div>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight">{choice.title}</h2>
            <p className="mb-5 mt-3 text-sm leading-6 text-n4">{choice.description}</p>
            <div className="mt-auto rounded-lg border border-n2/50 bg-n1/50 px-3 py-2">
              {choice.features.map(([Icon, label]) => (
                <div key={label} className="flex min-h-9 items-center gap-2.5 text-xs text-n4">
                  <Icon
                    size={17}
                    className={`shrink-0 ${choice.orange ? 'text-orange' : 'text-primary'}`}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <Link
              to={choice.to}
              className={`mt-4 flex min-h-11 items-center justify-center gap-3 rounded-md px-3 text-sm font-semibold text-n0 ${choice.orange ? 'bg-orange hover:bg-warning' : 'bg-primary hover:bg-primary-deep'}`}
            >
              {choice.action}
              <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </div>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-n4">
        <GitFork size={13} />
        Chuyên môn độc lập · Quy trình rõ ràng · Kết quả truy nguồn được
      </p>
    </div>
  );
}
