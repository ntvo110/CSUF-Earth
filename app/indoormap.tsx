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
import { router } from "expo-router";

const IMG_W = 908;
const IMG_H = 1692;

// All floor images — Ground is shown first; others load when floor changes
const FLOOR_IMAGES: Record<string, any> = {
  Ground: require("../assets/images/Ground_floor.png"),
  Second: require("../assets/images/Second_floor.png"),
  Third:  require("../assets/images/Third_floor.png"),
  Fourth: require("../assets/images/Fourth_floor.png"),
  Fifth:  require("../assets/images/Fifth_floor.png"),
};

export default function Indoormap() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [activeFloor] = useState("Ground");
  const [zoom, setZoom] = useState(1);

  const imgDisplayH = width * (IMG_H / IMG_W);

  const zoomIn  = () => setZoom(z => Math.min(+(z + 0.25).toFixed(2), 3));
  const zoomOut = () => setZoom(z => Math.max(+(z - 0.25).toFixed(2), 0.75));

  const onEnd = () => router.push("/map");

  return (
    <View style={styles.container}>

      {/* ── Floor plan map ── */}
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

      {/* ── Top navigation banner ── */}
      <View style={[styles.topTab, { top: insets.top + 16 }]}>
        <View style={styles.directionBox}>
          <Text style={styles.distanceText}>3 ft</Text>
          <Text style={styles.navigationText}>take a left onto path</Text>
        </View>
      </View>

      {/* ── Bottom ETA card ── */}
      <View style={[styles.bottomTab, { paddingBottom: insets.bottom }]}>
        <View style={styles.arrivalTimeBox}>
          <View style={styles.firstRow}>
            <Text style={styles.timeText}>3 min</Text>
            <TouchableOpacity style={styles.endButton} onPress={onEnd}>
              <Text style={styles.buttonText}>end</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.destinationText}>to CS104 in Computer Science Building</Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },

  // ── Top banner ──
  topTab: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  directionBox: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#5797F7",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  distanceText: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "700",
    textAlign: "center",
  },
  navigationText: {
    color: "#f3efef",
    fontSize: 24,
    fontWeight: "500",
    textAlign: "center",
  },

  // ── Bottom card ──
  bottomTab: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  arrivalTimeBox: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  firstRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  timeText: {
    fontSize: 32,
    fontWeight: "600",
    color: "#000",
  },
  endButton: {
    width: 100,
    height: 40,
    backgroundColor: "#5797F7",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 20,
    color: "#fff",
  },
  destinationText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000",
  },

  // ── Zoom controls ──
  zoomControls: {
    position: "absolute",
    bottom: 180,
    right: 16,
  },
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
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.08)",
  },
  zoomRight: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#272BA0",
    lineHeight: 30,
  },
});
