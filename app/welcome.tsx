import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export default function Welcome() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ from?: string }>();

  // Figma base width = 402
  const BASE_W = 402;
  const s = useMemo(() => width / BASE_W, [width]);
  const px = (n: number) => Math.round(n * s);

  // --- Login blob (start) ---
  // from your login figma: w=642 h=506 left=-120 top=657
  const LOGIN = useMemo(
    () => ({
      w: px(642),
      h: px(506),
      left: px(-120),
      top: px(657),
      radius: 9999,
    }),
    [s]
  );

  // --- Welcome blob (end) ---
  // from your welcome figma: w=642 h=653 left=-120 top=131
  const WELCOME = useMemo(
    () => ({
      w: px(642),
      h: px(653),
      left: px(-120),
      top: px(131),
      radius: 9999,
    }),
    [s]
  );

  // Animated values
  const blobTop = useRef(new Animated.Value(params.from === "login" ? LOGIN.top : WELCOME.top)).current;
  const blobH = useRef(new Animated.Value(params.from === "login" ? LOGIN.h : WELCOME.h)).current;
  const contentOpacity = useRef(new Animated.Value(params.from === "login" ? 0 : 1)).current;
  const contentY = useRef(new Animated.Value(params.from === "login" ? px(10) : 0)).current;

  useEffect(() => {
    if (params.from === "login") {
      // Start blob from login values
      blobTop.setValue(LOGIN.top);
      blobH.setValue(LOGIN.h);
      contentOpacity.setValue(0);
      contentY.setValue(px(10));

      Animated.parallel([
        Animated.timing(blobTop, {
          toValue: WELCOME.top,
          duration: 520,
          useNativeDriver: false,
        }),
        Animated.timing(blobH, {
          toValue: WELCOME.h,
          duration: 520,
          useNativeDriver: false,
        }),
      ]).start(() => {
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(contentY, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [params.from, s]);

  const onContinue = () => {
    router.push("/tutorial"); // your tutorial route
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.flex} onPress={onContinue}>
        <View style={styles.stage}>
          {/* background */}
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#F2F2F2" }]} />

          {/* animated blob */}
          <Animated.View
            style={{
              position: "absolute",
              width: WELCOME.w,
              height: blobH,
              left: WELCOME.left,
              top: blobTop,
              borderRadius: WELCOME.radius,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={["#F2F2F2", "#5797F7"]}
              locations={[0, 0.58]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ flex: 1 }}
            />
          </Animated.View>

          {/* Center content */}
          <Animated.View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              opacity: contentOpacity,
              transform: [{ translateY: contentY }],
              paddingHorizontal: px(24),
            }}
          >
            {/* icon (placeholder) - replace with your SVG/image later */}
            <View style={{ width: px(96), height: px(96), alignItems: "center", justifyContent: "center" }}>
              <View
                style={{
                  width: px(64),
                  height: px(80),
                  backgroundColor: "#FF7900",
                  borderRadius: px(32),
                }}
              />
            </View>

            <Text style={{ marginTop: px(14), color: "#272BA0", fontSize: px(32), fontWeight: "500" }}>
              welcome to
            </Text>

            <Text style={{ marginTop: px(12), color: "#272BA0", fontSize: px(48), fontWeight: "500" }}>
              CSUF
            </Text>

            <Text
              style={{
                marginTop: px(12),
                textAlign: "center",
                color: "#272BA0",
                fontSize: px(16),
                fontWeight: "500",
                lineHeight: px(22),
                maxWidth: px(304),
              }}
            >
              Find your classes easily and navigate your way through campus.
            </Text>

            {/* subtle hint (optional) */}
            <Text
              style={{
                marginTop: px(26),
                color: "rgba(39,43,160,0.35)",
                fontSize: px(13),
                fontWeight: "500",
              }}
            >
              tap anywhere to continue
            </Text>
          </Animated.View>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2F2F2" },
  flex: { flex: 1 },
  stage: { flex: 1 },
});
