
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store/Store';
import RootNavigator from './src/navigations/RootNavigator';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
};

export default App;