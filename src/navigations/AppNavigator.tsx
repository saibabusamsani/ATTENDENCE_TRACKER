import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerParamList } from '../types/navigation';
import MainTabNavigator from './MainTabNavigator';



const Drawer = createDrawerNavigator<DrawerParamList>();

const AppNavigator = () => {
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="HomeTabs" component={MainTabNavigator} />
    </Drawer.Navigator>
  );
};

export default AppNavigator;