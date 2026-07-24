export interface TotalTimeCardRecord {
  firstName: string;
  lastName: string;
  fullName: string;
  personCode: string;
  groupName: string;
  date: string;
  weekday: number;
  timetableName: string;

  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;

  clockInDate: string;
  clockInTime: string;
  clockInSource: number;
  clockInDevice: string;
  clockInArea: string;

  clockOutDate: string;
  clockOutTime: string;
  clockOutSource: number;
  clockOutDevice: string;
  clockOutArea: string;

  attendanceStatus: number;
  workDuration: string;
  absenceDuration: string;
  lateDuration: string;
  earlyDuration: string;
  breakDuration: string;
  leaveDuration: string;
  overtimeDuration: string;
  workdayOvertimeDuration: string;
  weekendOvertimeDuration: string;
  leaveTypes: string;
}

export const ATTENDANCE_STATUS_MAP: Record<number, string> = {
  0: 'Normal',
  1: 'Late',
  2: 'Early Leave',
  3: 'Absent',
  4: 'Leave',
  5: 'Absent',
};

export interface TotalTimeCardListParams {
  personCode?: string;
  month?: string;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
  searchValue?: string;
}

export interface AttendanceSummary {
  presentCount: number;
  avgDelayMinutes: number;
  lateCount: number;
  totalPunches: number;
  absentCount: number;
  earlyLogoutCount: number;
  allDevicesSynced: boolean;
  totalCount: number;
  lastFetchedTime:string
}

export interface TotalTimeCardListResponse {
  totalRecords: number;
  message: string;
  response: TotalTimeCardRecord[];
  otherInfo: AttendanceSummary;
}