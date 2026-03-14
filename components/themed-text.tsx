import { useMemo } from "react";
import { StyleSheet, Text, useWindowDimensions, type TextProps } from "react-native";


export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'label' | 'guest';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {

      return (
        <Text
          style={[
            {  },
            type === 'default' ? styles.default : undefined,
            type === 'title' ? styles.title : undefined,
            type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
            type === 'subtitle' ? styles.subtitle : undefined,
            type === 'link' ? styles.link : undefined,
            type === 'label' ? styles.label : undefined,
            type === 'guest' ? styles.guest : undefined,
            style,
          ]}
          {...rest}
        />
      );
}
const { width, height } = useWindowDimensions();
const BASE_W = 402;
const s = useMemo(() => width / BASE_W, [width]);
const px = (n: number) => Math.round(n * s);

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    position: "absolute",
    width: px(320),
    left: px(40),
    textAlign: "center",
    color: "#272BA0",
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
  label: {
    position: "absolute",
    left: px(63),
    fontSize: px(16),
    fontWeight: "500",
    color: "#2C2C2C",
  },
  guest: {
    textAlign: "center",
    fontSize: px(14),
    fontWeight: "500",
    color: "#000",
    textDecorationLine: "underline",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: px(4) },
    textShadowRadius: px(4),
  },
});