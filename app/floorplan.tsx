import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FLOORS = ["Ground", "Second", "Third", "Fourth", "Fifth"];

const FLOOR_LABELS: Record<string, string> = {
  Ground: "G", Second: "2", Third: "3", Fourth: "4", Fifth: "5",
};

const FLOOR_IMAGES: Record<string, any> = {
  Ground: require("../assets/images/Ground_floor.png"),
  Second: require("../assets/images/Second_floor.png"),
  Third:  require("../assets/images/Third_floor.png"),
  Fourth: require("../assets/images/Fourth_floor.png"),
  Fifth:  require("../assets/images/Fifth_floor.png"),
};

const IMG_W = 908;
const IMG_H = 1692;

export default function FloorPlan() {
  const [activeFloor, setActiveFloor] = useState("Ground");
  const [zoom, setZoom] = useState(1);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const imgDisplayH = width * (IMG_H / IMG_W);

  const zoomIn  = () => setZoom(z => Math.min(+(z + 0.25).toFixed(2), 3));
  const zoomOut = () => setZoom(z => Math.max(+(z - 0.25).toFixed(2), 0.75));

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          CS Building · {activeFloor} Floor
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* ── Floor plan area ── */}
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            minHeight: imgDisplayH * zoom,
            alignItems: "center",
            justifyContent: "center",
          }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View style={{ width, height: imgDisplayH, transform: [{ scale: zoom }] }}>
            <Image
              source={FLOOR_IMAGES[activeFloor]}
              style={{ width, height: imgDisplayH }}
              resizeMode="stretch"
            />
          </View>
        </ScrollView>

        {/* ── Zoom controls ── */}
        <View style={styles.zoomControls}>
          <View style={styles.zoomRow}>
            <TouchableOpacity style={styles.zoomLeft} onPress={zoomIn}>
              <Text style={styles.zoomText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomRight} onPress={zoomOut}>
              <Text style={styles.zoomText}>−</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Floor selector chips ── */}
      <View style={[styles.selectorBar, { paddingBottom: insets.bottom + 12 }]}>
        {FLOORS.map(floor => (
          <TouchableOpacity
            key={floor}
            style={[styles.chip, activeFloor === floor && styles.chipActive]}
            onPress={() => setActiveFloor(floor)}
          >
            <Text style={[styles.chipText, activeFloor === floor && styles.chipTextActive]}>
              {FLOOR_LABELS[floor]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F2" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, color: "#272BA0", fontWeight: "600" },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#272BA0",
    textAlign: "center",
    flex: 1,
  },

  // ── Zoom controls ──
  zoomControls: { position: "absolute", bottom: 20, right: 16 },
  zoomRow: {
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.88)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  zoomLeft: {
    width: 56, height: 56,
    alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderRightColor: "rgba(0,0,0,0.08)",
  },
  zoomRight: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  zoomText: { fontSize: 28, fontWeight: "700", color: "#272BA0", lineHeight: 30 },

  // ── Floor selector ──
  selectorBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingTop: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    paddingHorizontal: 20,
  },
  chip: {
    width: 52, height: 48,
    borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#f0f0f0",
  },
  chipActive: { backgroundColor: "#272BA0" },
  chipText: { fontSize: 15, fontWeight: "600", color: "#555" },
  chipTextActive: { color: "#fff" },
});
