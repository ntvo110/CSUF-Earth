import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CSUFButton from "../components/CSUFButton"; // <- adjust path if needed
import PaginationDots from "../components/PaginationDots"; // <- adjust path if needed

type Slide = {
  title: string;
  subtitle?: string;
};

const SLIDES: Slide[] = [
  { title: "to begin.." },
  { title: "placeholder", subtitle: "discover campus features and stay\nconnected" },
  { title: "placeholder", subtitle: "you're all set! let's explore campus\ntogether" },
];

export default function Tutorial() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  // Figma base frame (your export uses width 402)
  const BASE_W = 402;
  const BASE_H = 874;

  // Use width-scale for X sizing, and height-scale for Y spacing
  const sx = useMemo(() => width / BASE_W, [width]);
  const sy = useMemo(() => height / BASE_H, [height]);

  const px = (n: number) => Math.round(n * sx);
  const py = (n: number) => Math.round(n * sy);

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      // TODO: change this route to wherever your app goes after tutorial
      router.replace("/welcome");
    }
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  };

  return (
    <View style={styles.screen}>
      {/* Base background */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#F2F2F2" }]} />

      {/* Big gradient blob (Figma: 1013x1039, left -324, top 39) */}
      <LinearGradient
        colors={["#F2F2F2", "#5797F7"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          width: px(1013),
          height: py(1039),
          left: px(-324),
          top: py(39),
          borderRadius: 9999,
        }}
      />

      {/* Full-screen tap target (Apple-feel: tap anywhere to continue) */}
      <Pressable style={StyleSheet.absoluteFill} onPress={goNext}>
        <View />
      </Pressable>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentContainerStyle={{}}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            {/* Title block positioned to match Figma (y ~ 527) */}
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: py(500),
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: "#272BA0",
                  fontSize: px(32),
                  fontWeight: "500",
                }}
              >
                {item.title}
              </Text>

              {!!item.subtitle && (
                <Text
                  style={{
                    marginTop: py(18),
                    textAlign: "center",
                    color: "#272BA0",
                    fontSize: px(16),
                    fontWeight: "500",
                    lineHeight: px(22),
                    opacity: 0.9,
                  }}
                >
                  {item.subtitle}
                </Text>
              )}
            </View>
          </View>
        )}
      />


      {/* Pagination dots (locked above button) */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          alignItems: "center",
          bottom: insets.bottom + py(112),
        }}
      >
        <PaginationDots total={SLIDES.length} activeIndex={index} />
      </View>

      {/* Button pinned to bottom + safe area (FIXES “button not on screen”) */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          alignItems: "center",
          bottom: insets.bottom + py(33), // Figma-derived spacing
        }}
      >
        <CSUFButton
          title={index === SLIDES.length - 1 ? "finish" : "get started"}
          onPress={goNext}
          style={{
            width: px(205),
            height: py(44),
            borderRadius: py(22),
            backgroundColor: "#272BA0",
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
});
