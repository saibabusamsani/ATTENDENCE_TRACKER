import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Employee } from '../../api/types/Employee.type';
import { getEmployeesList } from '../../api/services/AttendanceService';
import { COLORS } from '../../constants/Colors';
import {
  EmployeesHeader,
  EmployeeCard,
  EmptyState,
  ErrorState,
  ListFooterLoader,
} from '../../components/EmployeesListComponents';
import { useNavigation } from '@react-navigation/native';

const EmployeesScreen = () => {

   const navigation = useNavigation(); 

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchEmployeesList = useCallback(async (search: string) => {
    try {
      setIsLoading(true);
      const result = await getEmployeesList({ searchValue: search });
      setEmployees(result.data.response);
      setTotalCount(result.data.totalRecords);
      setIsError(false);
      setErrorMessage('');
    } catch (err) {
      setIsError(true);
      setErrorMessage((err as Error).message || 'Something Went Wrong');
    } finally {
      setIsLoading(false);
    }
  }, []);

const handleNavigate = useCallback(
  (employee: Employee) => {
    navigation.navigate('EmployeeDetail', {
      personCode :employee.personCode || "",
      fullName:employee.fullName || ""

    });
  },
  [navigation],
);

  useEffect(() => {
    fetchEmployeesList(searchValue);
  }, [searchValue, fetchEmployeesList]);

const renderItem = useCallback(
  ({ item }: { item: Employee }) => (
    <EmployeeCard
      employee={item}
      onPress={handleNavigate}
    />
  ),
  [handleNavigate],
);
  const renderEmpty = useCallback(() => <EmptyState isLoading={isLoading} />, [isLoading]);

  if (isError) {
    return (
      <View style={styles.screen}>
        <ErrorState message={errorMessage} onRetry={() => fetchEmployeesList(searchValue)} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <EmployeesHeader
        title="Employees"
        searchValue={searchValue}
        onChangeSearch={setSearchValue}
        totalCount={totalCount}
      />
      <FlatList
        data={employees}
        keyExtractor={(item) => String(item.personCode)}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={isLoading ? <ListFooterLoader /> : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    flexGrow: 1,
  },
});

export default EmployeesScreen;