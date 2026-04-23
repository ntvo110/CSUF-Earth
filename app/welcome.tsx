import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Image,
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

  // Start blob from auth screen
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

  // End blob on welcome screen
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

  const shouldAnimate =
    params.from === "login" || params.from === "signup";

  const blobTop = useRef(
    new Animated.Value(shouldAnimate ? LOGIN.top : WELCOME.top)
  ).current;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const blobH = useRef(
    new Animated.Value(shouldAnimate ? LOGIN.h : WELCOME.h)
  ).current;

  const contentOpacity = useRef(
    new Animated.Value(shouldAnimate ? 0 : 1)
  ).current;

  const contentY = useRef(
    new Animated.Value(shouldAnimate ? px(10) : 0)
  ).current;

  useEffect(() => {
    if (shouldAnimate) {
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
  }, [shouldAnimate, s]);

  const onContinue = () => {
    router.push("/tutorial");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.flex} onPress={onContinue}>
        <View style={styles.stage}>
          {/* background */}
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: "#F2F2F2" },
            ]}
          />

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

          {/* center content */}
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
            <View
              style={{
                width: px(110),
                height: px(110),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={require("@/assets/images/Tuffy_App_Icon.png")}
                style={{
                  width: px(110),
                  height: px(110),
                  resizeMode: "contain",
                }}
              />
            </View>

            <Text
              style={{
                marginTop: px(14),
                color: "#272BA0",
                fontSize: px(32),
                fontWeight: "500",
              }}
            >
              welcome to
            </Text>

            <Text
              style={{
                marginTop: px(12),
                color: "#272BA0",
                fontSize: px(48),
                fontWeight: "700",
                letterSpacing: 1,
              }}
            >
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

            <Animated.Text
              style={{
                marginTop: px(26),
                color: "#ffffff",
                fontSize: px(13),
                fontWeight: "500",
                opacity: pulseAnim,
              }}
            >
              tap anywhere to continue
            </Animated.Text>
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