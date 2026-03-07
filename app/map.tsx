import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, {
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";

type Building = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export default function Map() {
  const mapRef = useRef<MapView | null>(null);

  const campusRegion: Region = {
    latitude: 33.8823,
    longitude: -117.8851,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const buildings: Building[] = [
    {
      id: "cs",
      name: "Computer Science Building",
      latitude: 33.8823,
      longitude: -117.8851,
    },
    {
      id: "tsu",
      name: "Titan Student Union",
      latitude: 33.8812,
      longitude: -117.8881,
    },
    {
      id: "mihaylo",
      name: "Mihaylo Hall",
      latitude: 33.8787,
      longitude: -117.8852,
    },
    {
      id: "pollak",
      name: "Pollak Library",
      latitude: 33.8815,
      longitude: -117.8854,
    },
  ];

  const campusBoundary = [
    { latitude: 33.8850, longitude: -117.8903 },
    { latitude: 33.8850, longitude: -117.8817 },
    { latitude: 33.8771, longitude: -117.8817 },
    { latitude: 33.8771, longitude: -117.8903 },
  ];

  const [mapRegion, setMapRegion] = useState<Region>(campusRegion);
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isOutsideCampus, setIsOutsideCampus] = useState(false);

  function isPointInPolygon(
    point: { latitude: number; longitude: number },
    polygon: { latitude: number; longitude: number }[]
  ) {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].latitude;
      const yi = polygon[i].longitude;
      const xj = polygon[j].latitude;
      const yj = polygon[j].longitude;

      const intersects =
        yi > point.longitude !== yj > point.longitude &&
        point.latitude <
          ((xj - xi) * (point.longitude - yi)) / (yj - yi) + xi;

      if (intersects) {
        inside = !inside;
      }
    }

    return inside;
  }

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function getUserLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          Alert.alert(
            "Location Permission Needed",
            "Please allow location access to show your position on the map."
          );
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const region: Region = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };

        setUserRegion(region);
        setMapRegion(region);
        setIsOutsideCampus(
          !isPointInPolygon(
            {
              latitude: region.latitude,
              longitude: region.longitude,
            },
            campusBoundary
          )
        );

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 3,
          },
          (updatedLocation) => {
            const updatedRegion: Region = {
              latitude: updatedLocation.coords.latitude,
              longitude: updatedLocation.coords.longitude,
              latitudeDelta: mapRegion.latitudeDelta,
              longitudeDelta: mapRegion.longitudeDelta,
            };

            setUserRegion(updatedRegion);
            setIsOutsideCampus(
              !isPointInPolygon(
                {
                  latitude: updatedRegion.latitude,
                  longitude: updatedRegion.longitude,
                },
                campusBoundary
              )
            );
          }
        );
      } catch (error) {
        console.log("Location error:", error);
      }
    }

    getUserLocation();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const centerOnUser = () => {
    if (userRegion && mapRef.current) {
      mapRef.current.animateToRegion(userRegion, 1000);
      setMapRegion(userRegion);
    }
  };

  const zoomIn = () => {
    const newRegion: Region = {
      ...mapRegion,
      latitudeDelta: Math.max(mapRegion.latitudeDelta / 2, 0.001),
      longitudeDelta: Math.max(mapRegion.longitudeDelta / 2, 0.001),
    };

    setMapRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  const zoomOut = () => {
    const newRegion: Region = {
      ...mapRegion,
      latitudeDelta: Math.min(mapRegion.latitudeDelta * 2, 0.5),
      longitudeDelta: Math.min(mapRegion.longitudeDelta * 2, 0.5),
    };

    setMapRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  const handleBuildingPress = (building: Building) => {
    setSelectedBuilding(building);

    const buildingRegion: Region = {
      latitude: building.latitude,
      longitude: building.longitude,
      latitudeDelta: 0.003,
      longitudeDelta: 0.003,
    };

    setMapRegion(buildingRegion);
    mapRef.current?.animateToRegion(buildingRegion, 800);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={campusRegion}
        showsUserLocation={true}
        onRegionChangeComplete={(region) => setMapRegion(region)}
      >
        <Polygon
          coordinates={campusBoundary}
          strokeColor="#335991"
          fillColor="rgba(87,151,247,0.10)"
          strokeWidth={2}
        />

        {buildings.map((building) => (
          <Marker
            key={building.id}
            coordinate={{
              latitude: building.latitude,
              longitude: building.longitude,
            }}
            title={building.name}
            onPress={() => handleBuildingPress(building)}
          />
        ))}

        {selectedBuilding && userRegion && (
          <Polyline
            coordinates={[
              {
                latitude: userRegion.latitude,
                longitude: userRegion.longitude,
              },
              {
                latitude: selectedBuilding.latitude,
                longitude: selectedBuilding.longitude,
              },
            ]}
            strokeColor="#5797F7"
            strokeWidth={5}
          />
        )}
      </MapView>

      <LinearGradient
        colors={["#5797F7", "rgba(51,89,145,0)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientOverlay}
      />

      {isOutsideCampus && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            You are outside the CSUF campus boundary.
          </Text>
        </View>
      )}

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.locationPill} onPress={centerOnUser}>
          <Text style={styles.locationPillText}>My Location</Text>
        </TouchableOpacity>

        <View style={styles.zoomRow}>
          <TouchableOpacity style={styles.zoomLeft} onPress={zoomIn}>
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.zoomRight} onPress={zoomOut}>
            <Text style={styles.zoomText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.glassContainer}>
        <BlurView intensity={60} tint="light" style={styles.blurLayer}>
          <View style={styles.handle} />

          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchText}>
              {selectedBuilding
                ? `Route to ${selectedBuilding.name}`
                : "Search Campus"}
            </Text>
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

  gradientOverlay: {
    position: "absolute",
    width: 466,
    height: 333,
    left: -30,
    top: -47,
    borderRadius: 8,
  },

  warningBanner: {
    position: "absolute",
    top: 70,
    alignSelf: "center",
    backgroundColor: "rgba(255, 244, 204, 0.96)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6C15A",
  },

  warningText: {
    color: "#8A6700",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  mapControls: {
    position: "absolute",
    top: 120,
    right: 20,
    alignItems: "center",
  },

  locationPill: {
    minWidth: 140,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  locationPillText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#335991",
  },

  zoomRow: {
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
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
    color: "#335991",
    lineHeight: 30,
  },

  glassContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 155,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    overflow: "hidden",
  },

  blurLayer: {
    flex: 1,
    paddingTop: 20,
    alignItems: "center",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: "rgba(250,250,250,0.7)",
  },

  handle: {
    width: 145,
    height: 6,
    backgroundColor: "#999999",
    borderRadius: 8,
    marginBottom: 25,
  },

  searchButton: {
    width: 336,
    height: 48,
    backgroundColor: "#5797F7",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  searchText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});