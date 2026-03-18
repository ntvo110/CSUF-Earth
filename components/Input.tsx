import type { TextInputProps } from 'react-native';
import { StyleSheet, TextInput } from 'react-native';

interface InputProps extends TextInputProps {
  placeholder?: string;
}

export default function Input({ placeholder, style, ...props }: InputProps) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholder={placeholder}
      placeholderTextColor="#999999"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 16,
  },
});

