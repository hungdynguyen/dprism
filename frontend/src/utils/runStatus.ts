/** Frontend contract for the future execution API; backend must mirror these values. */
export type RunStatus = 'RUNNING' | 'COMPLETED' | 'INCOMPLETE';
export type TaskStatus =
  | 'PENDING'
  | 'ASSESSING'
  | 'REVIEWING'
  | 'SYNTHESIZING'
  | 'DONE'
  | 'FAILED'
  | 'SKIPPED';
export type Tone = 'neutral' | 'primary' | 'success' | 'warning';
export const TASK_STATUS: Record<TaskStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Chờ phụ thuộc', tone: 'neutral' },
  ASSESSING: { label: 'Đánh giá độc lập', tone: 'primary' },
  REVIEWING: { label: 'Phản biện chéo', tone: 'primary' },
  SYNTHESIZING: { label: 'Tổng hợp', tone: 'primary' },
  DONE: { label: 'Hoàn tất', tone: 'success' },
  FAILED: { label: 'Dừng tại đây', tone: 'warning' },
  SKIPPED: { label: 'Chưa thực hiện', tone: 'neutral' },
};
export const RUN_STATUS: Record<RunStatus, { label: string; tone: Tone }> = {
  RUNNING: { label: 'Đang chạy', tone: 'primary' },
  COMPLETED: { label: 'Hoàn tất', tone: 'success' },
  INCOMPLETE: { label: 'Chưa hoàn tất', tone: 'warning' },
};
const ACTIVE_TASKS = new Set<TaskStatus>(['ASSESSING', 'REVIEWING', 'SYNTHESIZING']);
export const isActiveTask = (status: TaskStatus) => ACTIVE_TASKS.has(status);
export const isRunActive = (status?: RunStatus) => status === 'RUNNING';
export const isTaskDone = (status?: TaskStatus) => status === 'DONE';
export const isIncomplete = (status: RunStatus) => status === 'INCOMPLETE';
