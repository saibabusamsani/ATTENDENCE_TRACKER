import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import RootStackNavigator from './RootStackNavigator';
import { COLORS } from '../constants/Colors';

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    border: COLORS.border,
  },
};

const RootNavigator: React.FC = () => {
  return (
    <SafeAreaView style={{ flex: 1 ,backgroundColor:COLORS.primaryDark}} edges={['top']}>
      <StatusBar barStyle="light-content"/>
      <NavigationContainer theme={AppTheme}>
        <RootStackNavigator />
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default RootNavigator;