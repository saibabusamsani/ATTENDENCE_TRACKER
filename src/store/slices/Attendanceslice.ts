import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getTotalTimeCardList } from '../../api/services/AttendanceService';
import {
  TotalTimeCardListParams,
  TotalTimeCardRecord,
  AttendanceSummary,
} from '../../api/types/Attendance.types';
import { ApiError, parseApiError } from '../../api/ErrorHandler';
import { RootState } from '../Store';

// ---------------------------------------------------------------------
// Two screens (Dashboard, Employee Detail) hit the SAME API. `scope` just
// tells the reducer which slot in state to write the result into.
// ---------------------------------------------------------------------
type Scope = 'dashboard' | 'employee';
type RequestStatus = 'idle' | 'loading' | 'loadingMore' | 'succeeded' | 'failed';

interface ListState {
  records: TotalTimeCardRecord[];
  page: number;
  total: number;
  hasMore: boolean;
  status: RequestStatus;
  error: string | null;
  summary: AttendanceSummary | null;
}

interface AttendanceState {
  dashboard: ListState;
  employee: ListState;
}

const FIRST_PAGE = 0;

const emptyList = (): ListState => ({
  records: [],
  page: FIRST_PAGE,
  total: 0,
  hasMore: true,
  status: 'idle',
  error: null,
  summary: null,
});

const initialState: AttendanceState = {
  dashboard: emptyList(),
  employee: emptyList(),
};

// A record's identity is personCode + date — used to drop duplicates the
// API may return, whether within one page or across paginated pages.
const recordKey = (r: TotalTimeCardRecord): string => `${r.personCode}-${r.date}`;

const dedupeAppend = (existing: TotalTimeCardRecord[], incoming: TotalTimeCardRecord[]) => {
  const seen = new Set(existing.map(recordKey));
  const unique: TotalTimeCardRecord[] = [];
  for (const record of incoming) {
    const key = recordKey(record);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(record);
  }
  return [...existing, ...unique];
};

// ---------------------------------------------------------------------
// ONE thunk. Dashboard calls it with { scope: 'dashboard', date, search },
// Employee Detail calls it with { scope: 'employee', personCode, fromDate, toDate }.
// ---------------------------------------------------------------------
type FetchArg = TotalTimeCardListParams & { scope: Scope };
type ThunkApiConfig = { rejectValue: ApiError };

export const fetchAttendanceList = createAsyncThunk<
  { scope: Scope; records: TotalTimeCardRecord[]; total: number; summary: AttendanceSummary | null; page: number },
  FetchArg,
  ThunkApiConfig
>('attendance/fetchAttendanceList', async ({ scope, ...params }, { rejectWithValue }) => {
  try {
    const page = params.pageNumber ?? FIRST_PAGE;
    const result = await getTotalTimeCardList({ ...params, pageNumber: page });
    return {
      scope,
      records: result.response,
      total: result.totalRecords ?? 0,
      summary: result.otherInfo ?? null,
      page,
    };
  } catch (err) {
    return rejectWithValue(parseApiError(err));
  }
});

// ---------------------------------------------------------------------
// Slice — logic lives directly in the builder callbacks; `state[scope]`
// picks dashboard vs. employee, so there's only one pending/fulfilled/
// rejected case total, not two.
// ---------------------------------------------------------------------
const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    resetAttendance: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceList.pending, (state, action) => {
        const list = state[action.meta.arg.scope];
        list.status = action.meta.arg.pageNumber ? 'loadingMore' : 'loading';
        list.error = null;
      })
      .addCase(fetchAttendanceList.fulfilled, (state, action) => {
        const { scope, records, total, summary, page } = action.payload;
        const list = state[scope];
        list.records = page === FIRST_PAGE ? dedupeAppend([], records) : dedupeAppend(list.records, records);
        list.page = page;
        list.total = total;
        list.hasMore = list.records.length < total;
        list.status = 'succeeded';
        list.summary = summary;
      })
      .addCase(fetchAttendanceList.rejected, (state, action) => {
        const list = state[action.meta.arg.scope];
        list.status = 'failed';
        list.error = action.payload?.message ?? 'Failed to load attendance data.';
      });
  },
});

export const { resetAttendance } = attendanceSlice.actions;
export const { reducer: attendanceReducer } = attendanceSlice;

export const selectDashboard = (state: RootState) => state.attendance.dashboard;
export const selectEmployee = (state: RootState) => state.attendance.employee;