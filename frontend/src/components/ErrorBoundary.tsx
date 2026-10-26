import { Component, type ReactNode } from 'react';
export class ErrorBoundary extends Component<
  Readonly<{ children: ReactNode }>,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div role="alert" className="mx-auto max-w-xl p-10">
        <h1 className="text-xl font-semibold">Không thể hiển thị màn hình</h1>
        <p className="my-4 text-n4">
          Tải lại ứng dụng để tiếp tục. Những bản nháp đã lưu và lịch sử trao đổi vẫn được giữ lại.
        </p>
        <button
          className="rounded bg-primary px-4 py-2 text-n0"
          onClick={() => window.location.reload()}
        >
          Tải lại trang
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
