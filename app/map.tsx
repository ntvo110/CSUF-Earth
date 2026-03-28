import BottomSheet, { BottomSheetFlatList, BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, {
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

const MAPS_API_KEY = Constants.expoConfig?.extra?.apiKey;

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
  const [filter, setFilter] = useState<Building[]>(buildings);
  const [searchQuery, setSearchQuery] = useState("");

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

  // adjust height of bottomsheet
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["20%", "90%"], []);

  const renderItem = useCallback(({ item }: { item: Building }) => (
    <TouchableOpacity style={styles.courseContainer} onPress={() => setSelectedBuilding(item)}>
      <Text style={styles.courseText}>{item.name}</Text>
    </TouchableOpacity>
  ), []);

  const handleSearch = (text: string) => {
    if(text) {
      let filteredList = buildings.filter(b => 
        b.name.toLowerCase().includes(text.toLowerCase()));

      setFilter(filteredList);
    } else{
      setFilter(buildings);
    }
  };

  const destination = selectedBuilding? {
        latitude: selectedBuilding.latitude,
        longitude: selectedBuilding.longitude
      }: null;

  return (
    <GestureHandlerRootView style={styles.container}>
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

        {userRegion && destination && (
          <MapViewDirections
            origin={userRegion}
            destination={destination}
            apikey={MAPS_API_KEY}
            strokeWidth={3}
            strokeColor="hot pink"
            mode="WALKING"
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

      <BottomSheet ref={bottomSheetRef} index={0} snapPoints={snapPoints} handleIndicatorStyle={styles.handle}>
      <BottomSheetView style={styles.container}>
        <BlurView intensity={60} tint="light" style={styles.blurLayer}>

          <BottomSheetTextInput
            style={styles.searchButton} 
            placeholder="Search Campus"
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
          />

          <BottomSheetFlatList<Building>
            data={filter}
            keyExtractor={(item: Building) => item.id} 
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        </BlurView>
      </BottomSheetView>
      </BottomSheet>
      </View>
    </GestureHandlerRootView>
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
    flex: 1,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    overflow: "hidden",
  },

  blurLayer: {
    flex: 1,
    paddingTop: 20,
    //alignItems: "center",
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
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  searchText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  plusButton: {
    position: "absolute",
    width: 48,
    height: 48,
    top: 343,
    bottom: 276,
  },

  courseText: {
    color: "#000000",
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "left",
  },

  courseContainer: {
    width: "100%",
    paddingHorizontal: 14,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },

  listContent: {
    paddingBottom: 24,
  },

});