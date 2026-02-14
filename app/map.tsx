import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

export default function Map() {
  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 33.8823,     // csuf campus latitude
          longitude: -117.8851,  // csuf campus longitude
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      />
      {/* gradient overlay */}
      <LinearGradient
        colors={["#5797F7", "rgba(51,89,145,0)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          width: 466,
          height: 333,
          left: -30,
          top: -47,
          borderRadius: 8,
        }}
      />

      {/* bottom search box */}
      <View style={styles.glassContainer}>
        <BlurView intensity={60} tint="light" style={styles.blurLayer}>
          
          {/* handle bar */}
          <View style={styles.handle} />

          {/* search button */}
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchText}>Search Campus</Text>
          </TouchableOpacity>

        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* bottom search box */
  glassContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 155,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    overflow: "hidden",
  },

  /* blur layer */
  blurLayer: {
    flex: 1,
    paddingTop: 20,
    alignItems: "center",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: "rgba(250,250,250,0.7)", // glass fill
  },

  /* handle bar */
  handle: {
    width: 145,
    height: 6,
    backgroundColor: "#999999",
    borderRadius: 8,
    marginBottom: 25,
  },

  /* search button */
  searchButton: {
    width: 336,
    height: 48,
    backgroundColor: "#5797F7",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  /* Search Text */
  searchText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
});
