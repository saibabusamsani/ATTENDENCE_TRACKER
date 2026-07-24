import { ATTENDANCE_ENDPOINTS } from '../endpoints/Attendanceendpoints';
import axiosInstance from '../Interceptors';
import { TotalTimeCardListParams, TotalTimeCardListResponse } from '../types/Attendance.types';
import { EmployeeListParams } from '../types/Employee.type';


export const getTotalTimeCardList = async (params: TotalTimeCardListParams = {}): Promise<TotalTimeCardListResponse> => {

  const response = await axiosInstance.get<TotalTimeCardListResponse>(ATTENDANCE_ENDPOINTS.TOTAL_TIME_CARD_LIST, { params });
  return response.data;
};

export const getEmployeesList = async (params :EmployeeListParams={})=>{
   
  const response = await axiosInstance.get(ATTENDANCE_ENDPOINTS.EMPLOYEES_LIST,{params});

  return response;
}
