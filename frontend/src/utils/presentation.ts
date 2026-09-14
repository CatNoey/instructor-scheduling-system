import { InstructorApplication, ScheduleStatus, TrainingType } from '../types';

const trainingTypeLabels: Record<TrainingType, string> = {
  class: '학급',
  teacher: '교원',
  all_staff: '전 교직원',
  remote: '원격',
  other: '기타',
};

const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  open: '모집 중',
  closed: '마감',
  adjusted: '조정 필요',
};

export const trainingTypeLabel = (value: TrainingType) => trainingTypeLabels[value];
export const scheduleStatusLabel = (value: ScheduleStatus) => scheduleStatusLabels[value];
export const applicationStatusLabel = (value: InstructorApplication['status']) => ({
  pending: '검토 대기',
  approved: '배정 완료',
  rejected: '반려',
}[value]);
export const formatBusinessDate = (value: string) => new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' }).format(new Date(`${value}T00:00:00`));
export const formatTime = (value: string) => new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
