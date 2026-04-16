import BottomSheet, { BottomSheetFlatList, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, {
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

import { getApps, initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVe9yRWAZEO_wjLNyaIl_PeB-gJW3uWkk",
  authDomain: "csuf-users-cd8ec.firebaseapp.com",
  projectId: "csuf-users-cd8ec",
  storageBucket: "csuf-users-cd8ec.firebasestorage.app",
  messagingSenderId: "631450114131",
  appId: "1:631450114131:web:2734b487bda05dcc0c0ea6",
};

// init firebase once so we dont create duplicate instances
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// google maps api key from app.config.js
const MAPS_API_KEY = Constants.expoConfig?.extra?.apiKey;

type Building = {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
};

// matches the structure of classroom docs in firestore
type Classroom = {
  id: string;
  name: string;
  roomNumber: string;
  building: string;
  buildingCode: string;
  formalName?: string;
  roomType?: string;
  defaultCapacity?: number;
  maxCapacity?: number;
  features?: string[];
  categories?: string[];
  layouts?: string[];
};

export default function Map() {
  const mapRef = useRef<MapView | null>(null);

  // default map view centered on CSUF
  const campusRegion: Region = {
    latitude: 33.8823,
    longitude: -117.8851,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // hardcoded buildings with their map coordinates
  const buildings: Building[] = [
    {
      id: "cs",
      name: "Computer Science Building",
      code: "CS",
      latitude: 33.88233,
      longitude: -117.88263,
    },
    {
      id: "tsu",
      name: "Titan Student Union",
      code: "TSU",
      latitude: 33.8812,
      longitude: -117.8881,
    },
    {
      id: "mihaylo",
      name: "Mihaylo Hall",
      code: "MH",
      latitude: 33.87869,
      longitude: -117.88329,
    },
    {
      id: "pollak",
      name: "Pollak Library",
      code: "PL",
      latitude: 33.8815,
      longitude: -117.8854,
    },
  ];

  // 4 corners that form the CSUF campus boundary polygon
  const campusBoundary = [
    { latitude: 33.8850, longitude: -117.8903 },
    { latitude: 33.8850, longitude: -117.8817 },
    { latitude: 33.8771, longitude: -117.8817 },
    { latitude: 33.8771, longitude: -117.8903 },
  ];

  const [mapRegion, setMapRegion] = useState<Region>(campusRegion);
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [isOutsideCampus, setIsOutsideCampus] = useState(false);
  const [filter, setFilter] = useState<Building[]>(buildings);
  const [searchQuery, setSearchQuery] = useState("");
  const [allClassrooms, setAllClassrooms] = useState<Classroom[]>([]);
  const [filteredClassrooms, setFilteredClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  // fetch all classrooms from firestore on load
  useEffect(() => {
    async function fetchClassrooms() {
      try {
        const snapshot = await getDocs(collection(db, "classrooms"));
        const data: Classroom[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Classroom));
        setAllClassrooms(data);
        setFilteredClassrooms(data);
      } catch (err) {
        console.error("Firestore fetch error:", err);
        Alert.alert("Error", "Could not load classroom data.");
      } finally {
        setLoading(false);
      }
    }
    fetchClassrooms();
  }, []);

  // ray casting algorithm to check if user is inside campus boundary
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

  // ask for location permission, get current position, and watch for movement
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

        // check if user is on campus when the app first loads
        setIsOutsideCampus(
          !isPointInPolygon(
            {
              latitude: region.latitude,
              longitude: region.longitude,
            },
            campusBoundary
          )
        );

        // keep checking every 3 seconds or every 3 meters moved
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

    // cleanup location watcher when component unmounts
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // animate map back to user location
  const centerOnUser = () => {
    if (userRegion && mapRef.current) {
      mapRef.current.animateToRegion(userRegion, 1000);
      setMapRegion(userRegion);
    }
  };

  // zoom in by halving the lat/lng delta
  const zoomIn = () => {
    const newRegion: Region = {
      ...mapRegion,
      latitudeDelta: Math.max(mapRegion.latitudeDelta / 2, 0.001),
      longitudeDelta: Math.max(mapRegion.longitudeDelta / 2, 0.001),
    };

    setMapRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  // zoom out by doubling the lat/lng delta
  const zoomOut = () => {
    const newRegion: Region = {
      ...mapRegion,
      latitudeDelta: Math.min(mapRegion.latitudeDelta * 2, 0.5),
      longitudeDelta: Math.min(mapRegion.longitudeDelta * 2, 0.5),
    };

    setMapRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  // when a building marker is tapped, filter rooms and fly the map to it
  const handleBuildingPress = (building: Building) => {
    setSelectedBuilding(building);
    setSelectedClassroom(null);
    setSearchQuery("");

    // filter to only show rooms in this building
    const rooms = allClassrooms.filter(c =>
      c.buildingCode === building.code || c.building === building.name
    );
    setFilteredClassrooms(rooms);

    const buildingRegion: Region = {
      latitude: building.latitude,
      longitude: building.longitude,
      latitudeDelta: 0.003,
      longitudeDelta: 0.003,
    };

    setMapRegion(buildingRegion);
    mapRef.current?.animateToRegion(buildingRegion, 800);

    // snap sheet to full height so user can see the room list
    bottomSheetRef.current?.snapToIndex(2);
  };

  // bottom sheet with 3 snap points: peeking, half, full
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["20%", "50%", "90%"], []);

  // each row in the classroom list
  const renderItem = useCallback(({ item }: { item: Classroom }) => (
    <TouchableOpacity style={styles.courseContainer} onPress={() => setSelectedClassroom(item)}>
      <Text style={styles.courseText}>Room {item.roomNumber} — {item.name}</Text>
      <Text style={styles.courseSubText}>{item.building} · {item.roomType || ""}</Text>
    </TouchableOpacity>
  ), []);

  // filters classrooms and buildings based on search input
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setSelectedClassroom(null);

    if (!text.trim()) {
      // empty search resets to current building or all classrooms
      if (selectedBuilding) {
        setFilteredClassrooms(allClassrooms.filter(c =>
          c.buildingCode === selectedBuilding.code || c.building === selectedBuilding.name
        ));
      } else {
        setFilteredClassrooms(allClassrooms);
      }
    } else {
      // search across room number, name, building, and type
      const q = text.toLowerCase();
      setFilteredClassrooms(allClassrooms.filter(c =>
        c.roomNumber?.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.building?.toLowerCase().includes(q) ||
        c.formalName?.toLowerCase().includes(q) ||
        c.roomType?.toLowerCase().includes(q)
      ));
    }

    // also filter markers on the map
    if (text) {
      setFilter(buildings.filter(b =>
        b.name.toLowerCase().includes(text.toLowerCase())
      ));
    } else {
      setFilter(buildings);
    }
  };

  // full detail view shown when user taps a classroom
  const renderClassroomDetail = () => {
    if (!selectedClassroom) return null;
    return (
      <ScrollView style={styles.detailContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* back button goes back to the room list */}
        <TouchableOpacity onPress={() => setSelectedClassroom(null)} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.detailTitle}>Room {selectedClassroom.roomNumber}</Text>
        <Text style={styles.detailSubtitle}>{selectedClassroom.formalName}</Text>

        {/* main info card */}
        <View style={styles.detailCard}>
          <DetailRow label="Building" value={`${selectedClassroom.building} (${selectedClassroom.buildingCode})`} />
          <DetailRow label="Room Type" value={selectedClassroom.roomType || "—"} />
          <DetailRow label="Capacity" value={String(selectedClassroom.maxCapacity || selectedClassroom.defaultCapacity || "—")} />
        </View>

        {/* Array.isArray prevents crash if field is missing in firestore */}
        {Array.isArray(selectedClassroom.features) && selectedClassroom.features.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Features</Text>
            <View style={styles.tagRow}>
              {selectedClassroom.features.map((f, i) => <View key={i} style={styles.tag}><Text style={styles.tagText}>{f}</Text></View>)}
            </View>
          </>
        )}

        {Array.isArray(selectedClassroom.categories) && selectedClassroom.categories.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Categories</Text>
            <View style={styles.tagRow}>
              {selectedClassroom.categories.map((c, i) => <View key={i} style={styles.tag}><Text style={styles.tagText}>{c}</Text></View>)}
            </View>
          </>
        )}

        {Array.isArray(selectedClassroom.layouts) && selectedClassroom.layouts.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Layouts</Text>
            <View style={styles.tagRow}>
              {selectedClassroom.layouts.map((l, i) => <View key={i} style={styles.tag}><Text style={styles.tagText}>{l}</Text></View>)}
            </View>
          </>
        )}
      </ScrollView>
    );
  };

  // directions destination is the selected building
  const destination = selectedBuilding ? {
    latitude: selectedBuilding.latitude,
    longitude: selectedBuilding.longitude
  } : null;

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
        {/* blue tinted polygon showing campus boundary */}
        <Polygon
          coordinates={campusBoundary}
          strokeColor="#335991"
          fillColor="rgba(87,151,247,0.10)"
          strokeWidth={2}
        />

        {/* drop a marker for each building */}
        {buildings.map((building) => (
          <Marker
            key={building.id}
            coordinate={{
              latitude: building.latitude,
              longitude: building.longitude,
            }}
            title={building.name}
            // selected building turns orange
            pinColor={selectedBuilding?.id === building.id ? "#FF6B35" : "#5797F7"}
            onPress={() => handleBuildingPress(building)}
          />
        ))}

        {/* straight line from user to selected building */}
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

        {/* walking directions route from google maps */}
        {userRegion && destination && (
          <MapViewDirections
            origin={userRegion}
            destination={destination}
            apikey={MAPS_API_KEY}
            strokeWidth={3}
            strokeColor="hotpink"
            mode="WALKING"
          />
        )}
      </MapView>

      {/* blue gradient overlay at the top */}
      <LinearGradient
        colors={["#5797F7", "rgba(51,89,145,0)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientOverlay}
      />

      {/* warning banner shown when user is off campus */}
      {isOutsideCampus && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            You are outside the CSUF campus boundary.
          </Text>
        </View>
      )}

      {/* floating map controls on the right side */}
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

      {/* bottom sheet, cant pan it down so list scroll doesnt conflict */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        handleIndicatorStyle={styles.handle}
        enablePanDownToClose={false}
      >
        <View style={styles.container}>
          <View style={styles.sheetContent}>

            {/* show detail view or room list depending on selection */}
            {selectedClassroom ? (
              renderClassroomDetail()
            ) : (
              <>
                {/* building header with back button */}
                {selectedBuilding && (
                  <View style={styles.buildingHeader}>
                    <TouchableOpacity onPress={() => {
                      setSelectedBuilding(null);
                      setFilteredClassrooms(allClassrooms);
                      setSearchQuery("");
                    }}>
                      <Text style={styles.backButtonText}>← All Buildings</Text>
                    </TouchableOpacity>
                    <Text style={styles.buildingHeaderText}>{selectedBuilding.name}</Text>
                  </View>
                )}

                <BottomSheetTextInput
                  style={styles.searchButton}
                  placeholder={selectedBuilding ? `Search ${selectedBuilding.name}...` : "Search Campus"}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    handleSearch(text);
                  }}
                />

                {loading ? (
                  <Text style={styles.loadingText}>Loading classrooms...</Text>
                ) : filteredClassrooms.length === 0 ? (
                  <Text style={styles.loadingText}>No classrooms found.</Text>
                ) : (
                  <BottomSheetFlatList<Classroom>
                    data={filteredClassrooms}
                    keyExtractor={(item: Classroom) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    nestedScrollEnabled={true}
                  />
                )}
              </>
            )}

          </View>
        </View>
      </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

// reusable label/value row used in the classroom detail card
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailRowLabel}>{label}</Text>
    <Text style={styles.detailRowValue}>{value}</Text>
  </View>
);

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

  sheetContent: {
    flex: 1,
    paddingTop: 20,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: "rgba(250,250,250,0.97)",
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
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
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

  buildingHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  buildingHeaderText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#335991",
    marginTop: 4,
  },

  loadingText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontSize: 15,
  },

  courseText: {
    color: "#000000",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "left",
  },

  courseSubText: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },

  courseContainer: {
    width: "100%",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },

  listContent: {
    paddingBottom: 24,
  },

  detailContainer: { flex: 1, paddingHorizontal: 16 },
  backButton: { paddingVertical: 8 },
  backButtonText: { color: "#335991", fontSize: 15, fontWeight: "600" },
  detailTitle: { fontSize: 26, fontWeight: "700", color: "#335991", marginTop: 8 },
  detailSubtitle: { fontSize: 13, color: "#999", marginBottom: 16 },
  detailCard: {
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailRowLabel: { color: "#888", fontSize: 14 },
  detailRowValue: { color: "#2d3748", fontSize: 14, fontWeight: "500" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#c86118",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tag: {
    backgroundColor: "#ebf4ff",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  tagText: { color: "#335991", fontSize: 13 },
});
