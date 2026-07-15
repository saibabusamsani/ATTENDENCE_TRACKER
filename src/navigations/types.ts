export type BottomTabParamList = {
  Dashboard: undefined;
  Employees: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  EmployeeDetail: {
    personCode: string;
    fullName: string;
    groupName: string;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}