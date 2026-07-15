import { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/Store';
import { fetchAttendanceList, selectDashboard, selectEmployee } from '../store/slices/AttendanceSlice';
import { useDebouncedValue } from './useDebouncedValue';

const FIRST_PAGE = 0;

interface Options {
  scope: 'dashboard' | 'employee';
  personCode?: string; 
  fromDate?: string;
  toDate?: string;
}

// `scope` picks which slot of the store it reads/writes
export const useAttendance = ({ scope, personCode, fromDate, toDate }: Options) => {
  const dispatch = useDispatch<AppDispatch>();
  const selector = scope === 'dashboard' ? selectDashboard : selectEmployee;
  const { records, total, status, error, hasMore, page, summary } = useSelector((s: RootState) => {
    console.log("store : ",s.attendance)
    return selector(s)
});

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const load = useCallback(
    (pageNumber: number) => {
      dispatch(
        fetchAttendanceList({
          scope,
          personCode,
          date: scope === 'dashboard' ? fromDate : undefined,
          fromDate: scope === 'employee' ? fromDate : undefined,
          toDate: scope === 'employee' ? toDate : undefined,
          pageNumber,
          searchValue: debouncedSearch || undefined,
        }),
      );
    },
    [dispatch, scope, personCode, fromDate, toDate, debouncedSearch],
  );

  useEffect(() => {
    load(FIRST_PAGE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, personCode, fromDate, toDate, debouncedSearch]);

  const handleLoadMore = useCallback(() => {
    if (status === 'loading' || status === 'loadingMore' || !hasMore) return;
    load(page + 1);
  }, [status, hasMore, page, load]);

  return {
    records,
    total,
    isLoading: status === 'loading',
    isRefreshing: status === 'loading' && page === FIRST_PAGE,
    error,
    summary,
    searchInput,
    setSearchInput,
    handleLoadMore,
    handleRefresh: () => load(FIRST_PAGE),
  };
};