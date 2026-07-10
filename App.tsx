import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import NativeCalculator from './src/specs/NativeCalculator';

export default function App() {
  const [display, setDisplay] = useState('0');
  const [firstValue, setFirstValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);

  const handleNumber = (num: string) => {
    setDisplay(display === '0' ? num : display + num);
  };

  const handleOperator = (op: string) => {
    setFirstValue(parseFloat(display));
    setOperator(op);
    setDisplay('0');
  };

  const handleEquals = () => {
    if (firstValue === null || operator === null) return;
    const secondValue = parseFloat(display);
    let result = 0;

    switch (operator) {
      case '+': result = NativeCalculator.add(firstValue, secondValue); break;
      case '-': result = NativeCalculator.subtract(firstValue, secondValue); break;
      case '×': result = NativeCalculator.multiply(firstValue, secondValue); break;
      case '÷': result = NativeCalculator.divide(firstValue, secondValue); break;
    }

    setDisplay(result.toString());
    setFirstValue(null);
    setOperator(null);
  };

  const handleClear = () => {
    setDisplay('0');
    setFirstValue(null);
    setOperator(null);
  };

  const buttons = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', 'C', '=', '+'],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.displayBox}>
        <Text style={styles.displayText}>{display}</Text>
      </View>
      {buttons.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((btn) => (
            <TouchableOpacity
              key={btn}
              style={styles.button}
              onPress={() => {
                if (btn === 'C') handleClear();
                else if (btn === '=') handleEquals();
                else if (['+', '-', '×', '÷'].includes(btn)) handleOperator(btn);
                else handleNumber(btn);
              }}
            >
              <Text style={styles.buttonText}>{btn}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', padding: 10, backgroundColor: '#000' },
  displayBox: { padding: 20, alignItems: 'flex-end' },
  displayText: { color: '#fff', fontSize: 48 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  button: {
    flex: 1, margin: 4, paddingVertical: 20,
    backgroundColor: '#333', borderRadius: 40, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 24 },
});