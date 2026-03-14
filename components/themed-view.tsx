import { useMemo } from "react";
import { StyleSheet, useWindowDimensions, View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'glass' | 'input';
};

export function ThemedView({ style, lightColor, darkColor, type = 'default', ...otherProps }: ThemedViewProps) {

  return <View style={[{  }, 
    type === 'default' ? styles.default: undefined,
    type === 'glass' ? styles.glass : undefined,
    type === 'input' ? styles.input : undefined,
    style]} {...otherProps} />;
}

const { width, height } = useWindowDimensions();
const BASE_W = 402;
const s = useMemo(() => width / BASE_W, [width]);
const px = (n: number) => Math.round(n * s);

const styles = StyleSheet.create({
    default: {},
      glass: {
      position: "absolute",
      width: px(320),
      left: px(40),
      borderRadius: px(34),
      backgroundColor: "rgba(250,250,250,0.70)",
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: px(20),
      shadowOffset: { width: px(10), height: px(12) },
      elevation: 6,
    },
    input: {
      position: "absolute",
      width: px(272),
      height: px(40),
      left: px(62),
      backgroundColor: "#FFFFFF",
      borderRadius: px(12),
      borderWidth: 1,
      borderColor: "#F2F2F2",
      justifyContent: "center",
      paddingHorizontal: px(12),
    }
})