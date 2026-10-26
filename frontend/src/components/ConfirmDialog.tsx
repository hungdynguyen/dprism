import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}
type Confirm = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<Confirm | null>(null);
export function ConfirmProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null),
    resolver = useRef<((value: boolean) => void) | null>(null);
  const confirm = useCallback<Confirm>(
    (value) =>
      new Promise((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setOptions(value);
      }),
    [],
  );
  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };
  const context = useMemo(() => confirm, [confirm]);
  return (
    <ConfirmContext.Provider value={context}>
      {children}
      <Modal
        open={!!options}
        title={options?.title || ''}
        description={options?.message}
        onClose={() => close(false)}
      >
        <div className="flex justify-end gap-3">
          <Button onClick={() => close(false)}>Hủy</Button>
          <Button variant={options?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
            {options?.confirmLabel || 'Xác nhận'}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw Error('useConfirm requires ConfirmProvider.');
  return context;
}
