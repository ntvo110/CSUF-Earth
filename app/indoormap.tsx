import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function Indoormap() {

  // exits indoor navigation
  const onContinue = () => {
      router.push("/map");
  };

  return (
    <SafeAreaView style={styles.container}>
        {/* top banner for navigation */}
        <View style={styles.topTab}>
          <View style={styles.directionBox}>
            <Text style={styles.distanceText}>3 ft</Text>
            <Text style={styles.navigationText}>take a left onto path</Text>
          </View>
        </View>

        {/* bottom page for eta and destination */}
        <View style={styles.bottomTab}>
          <View style={styles.arrialTimeBox}>
            <View style={styles.firstRow}>
              <Text style={styles.timeText}>3 min</Text>
              <TouchableOpacity style={styles.endButton} onPress={onContinue}>
                <Text style={styles.buttonText}>end</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.destinationText}>to CS104 in Computer Science Building</Text>
          </View>
        </View>
        
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#c9c5c5",
  },

  topTab: {
    position: "absolute",
    top: 100,
    left: 7,
    alignItems: "flex-start",
    justifyContent: "center",
    display: "flex",
  },

  directionBox: {
    position: "absolute",
    padding: 20,
    width: 360,
    minHeight: 110,
    borderRadius: 20,
    backgroundColor: "#5797F7",
  },

  distanceText: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "700",
    textAlign: "center",
  },

  navigationText: {
    color: "#f3efef",
    fontSize: 24,
    fontWeight: "500",
    fontFamily: 'SF Pro',
    textAlign: "center",
  },

  arrialTimeBox: {
    minHeight: 140,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFFFF",
    alignItems: "flex-start",
    justifyContent: "center",
  },

  bottomTab: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    justifyContent: "center",
  },

  endButton: {
    width: 100,
    height: 40,
    left: 145,
    marginBottom: 15,
    backgroundColor: "#5797F7",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontWeight: "600",
    fontSize: 20,
    textAlign: "center",
    color: "#FFFFFF",
  },

  timeText: {
    fontSize: 32,
    fontWeight: "600",
    textAlign: "left",
    marginBottom: 15,
    marginLeft: 25,
    color: "#000000",
  },

  destinationText: {
    fontSize: 18,
    marginLeft: 25,
    fontWeight: "500",
    textAlign: "left",
    color: "#000000",
  },

  firstRow: {
    justifyContent: "space-between", 
    alignItems: "center",
    flexDirection: "row",
  },
  
});