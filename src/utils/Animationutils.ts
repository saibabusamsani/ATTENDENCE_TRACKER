import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Call before a state update that changes layout (tab switch, list
// resize, etc.) to animate the transition instead of snapping.
export const animateLayout = (): void => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
};