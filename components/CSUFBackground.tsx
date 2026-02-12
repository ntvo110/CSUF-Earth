import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

type Variant = "wave" | "bubble" | "fullGradient" | "bubbleTop";

export default function CSUFBackground({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: Variant;
}) {
  return (
    <View style={styles.container}>
      {variant === "bubbleTop" && (
        <LinearGradient
          colors={["#DCE6FF", "#9FB7FF"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.bubbleTop}
        />
      )}

      {/* keep your other variants if you already use them */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1 },

  // This creates that big rounded “cap” shape at the top like your screenshots
  bubbleTop: {
    position: "absolute",
    top: -220,
    left: -180,
    right: -180,
    height: 620,
    borderBottomLeftRadius: 600,
    borderBottomRightRadius: 600,
  },
});

