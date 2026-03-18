import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

type Variant = "default" | "figmaSmall";

export default function CSUFButton({
  title,
  onPress,
  style,
  textStyle,
  variant = "default",
}: {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: Variant;
}) {
  const baseBtn = variant === "figmaSmall" ? styles.btnFigmaSmall : styles.btn;
  const baseText = variant === "figmaSmall" ? styles.textFigmaSmall : styles.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [baseBtn, style, pressed && { opacity: 0.9 }]}
    >
      <Text style={[baseText, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Your existing default (unchanged)
  btn: {
    height: 64,
    borderRadius: 999,
    backgroundColor: "#1F2A8F",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "600",
    textTransform: "lowercase",
  },

  // NEW: matches Figma login button (190x40, radius 25, #5797F7, font 16)
  btnFigmaSmall: {
    width: 190,
    height: 40,
    borderRadius: 25,
    backgroundColor: "#5797F7",
    alignItems: "center",
    justifyContent: "center",
  },
  textFigmaSmall: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
    textTransform: "lowercase",
  },
});


