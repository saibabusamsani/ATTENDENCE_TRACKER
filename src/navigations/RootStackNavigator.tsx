import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import BottomTabNavigator from './BottomTabNavigator';
import EmployeeDetailScreen from '../screens/Employees/EmployeeDetailScreen';


const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStackNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
    <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
  </Stack.Navigator>
);

export default RootStackNavigator;