import BottomSheet, { BottomSheetBackgroundProps, BottomSheetFlatList, BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, {
  Marker,
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

type ScheduleEntry = {
  id: string;
  classroomId: string;
  classroomName: string;
  roomNumber: string;
  building: string;
  customName: string;
  days: string[];
  startTime: string;
  endTime: string;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];


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
  const [activeFilter, setActiveFilter] = useState<"classes" | "buildings" | "schedule">("classes");
  const [recentBuildings, setRecentBuildings] = useState<Building[]>([]);
  const [favoriteClassrooms, setFavoriteClassrooms] = useState<Set<string>>(new Set());
  const [favoriteBuildings, setFavoriteBuildings] = useState<Set<string>>(new Set());
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingRoom, setSchedulingRoom] = useState<Classroom | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ customName: "", days: [] as string[], startTime: "", endTime: "" });
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionMenuRoom, setActionMenuRoom] = useState<Classroom | null>(null);
  const [showNavOverlay, setShowNavOverlay] = useState(false);
  const [navTargetName, setNavTargetName] = useState("");

  const toggleFavoriteClassroom = (id: string) => {
    setFavoriteClassrooms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleFavoriteBuilding = (id: string) => {
    setFavoriteBuildings(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openActionMenu = (room: Classroom) => {
    setActionMenuRoom(room);
    setShowActionMenu(true);
  };

  const startNavigation = (classroom: Classroom) => {
    setNavTargetName(classroom.name);
    setShowNavOverlay(true);
    setTimeout(() => {
      setShowNavOverlay(false);
      router.push("/indoormap");
    }, 3000);
  };

  const openScheduleModal = (room: Classroom) => {
    setSchedulingRoom(room);
    setScheduleForm({ customName: room.name, days: [], startTime: "", endTime: "" });
    setShowScheduleModal(true);
  };

  const saveScheduleEntry = () => {
    if (!schedulingRoom) return;
    const entry: ScheduleEntry = {
      id: `${schedulingRoom.id}-${Date.now()}`,
      classroomId: schedulingRoom.id,
      classroomName: schedulingRoom.name,
      roomNumber: schedulingRoom.roomNumber,
      building: schedulingRoom.building,
      customName: scheduleForm.customName || schedulingRoom.name,
      days: scheduleForm.days,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
    };
    setScheduleEntries(prev => [...prev, entry]);
    setShowScheduleModal(false);
    setSchedulingRoom(null);
    setScheduleForm({ customName: "", days: [], startTime: "", endTime: "" });
  };

  const renderScheduleView = () => (
    <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      {scheduleEntries.length === 0 ? (
        <View style={styles.emptySchedule}>
          <Text style={styles.emptyScheduleTitle}>No classes scheduled</Text>
          <Text style={styles.emptyScheduleText}>
            Tap "Add" on any classroom, then choose "Add to Schedule".
          </Text>
        </View>
      ) : (
        scheduleEntries.map(entry => (
          <View key={entry.id} style={styles.scheduleEntry}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleEntryName}>{entry.customName}</Text>
              <Text style={styles.scheduleEntryRoom}>Room {entry.roomNumber} · {entry.building}</Text>
              {entry.days.length > 0 && (
                <Text style={styles.scheduleEntryMeta}>{entry.days.join("  ·  ")}</Text>
              )}
              {entry.startTime ? (
                <Text style={styles.scheduleEntryMeta}>
                  {entry.startTime}{entry.endTime ? `  –  ${entry.endTime}` : ""}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.scheduleEntryRemove}
              onPress={() => setScheduleEntries(prev => prev.filter(e => e.id !== entry.id))}
            >
              <Text style={styles.scheduleEntryRemoveText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </BottomSheetScrollView>
  );

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
      latitudeDelta: Math.max(mapRegion.latitudeDelta / 2, 0.0001),
      longitudeDelta: Math.max(mapRegion.longitudeDelta / 2, 0.0001),
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
    setRecentBuildings(prev => [building, ...prev.filter(b => b.id !== building.id)].slice(0, 3));

    // filter to only show rooms in this building
    const rooms = allClassrooms.filter(c =>
      c.buildingCode === building.code || c.building === building.name
    );
    setFilteredClassrooms(rooms);

    const buildingRegion: Region = {
      latitude: building.latitude,
      longitude: building.longitude,
      latitudeDelta: 0.0005,
      longitudeDelta: 0.0005,
    };

    setMapRegion(buildingRegion);
    mapRef.current?.animateToRegion(buildingRegion, 800);

    // snap sheet to full height so user can see the room list
    bottomSheetRef.current?.snapToIndex(0);
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

  const renderBuildingDetail = () => {
    if (!selectedBuilding) return null;
    const isFav = favoriteBuildings.has(selectedBuilding.id);
    return (
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.bdHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bdTitle}>{selectedBuilding.name}</Text>
            <Text style={styles.bdSubtitle}>Building</Text>
          </View>
          <TouchableOpacity
            onPress={() => { setSelectedBuilding(null); setFilteredClassrooms(allClassrooms); setSearchQuery(""); }}
            style={styles.closeBtn}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.navButton} onPress={centerOnUser}>
            <Image source={require("@/assets/images/walking_icon.png")} style={styles.navIcon} />
            <Text style={styles.navButtonText}>start navigation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBuildingBtn, isFav && styles.addBtnActive]}
            onPress={() => toggleFavoriteBuilding(selectedBuilding.id)}
          >
            <Text style={styles.addBuildingDots}>•••</Text>
            <Text style={[styles.addBuildingText, isFav && styles.addBtnTextActive]}>
              {isFav ? "Added" : "Add"}
            </Text>
          </TouchableOpacity>
        </View>

        {selectedBuilding.id === "cs" && (
          <Image source={require("@/assets/images/CSBuilding_Photo.png")} style={styles.buildingPhoto} />
        )}

        <Text style={styles.bdSectionHeading}>About</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>
            The {selectedBuilding.name} houses classrooms, computer labs, and faculty offices for students and staff at California State University, Fullerton.
          </Text>
        </View>

        <Text style={styles.bdSectionHeading}>Classrooms</Text>

        <View style={styles.classroomSearchBar}>
          <Image source={require("@/assets/images/search_icon.png")} style={styles.searchIconImg} />
          <BottomSheetTextInput
            style={styles.searchInput}
            placeholder="Search Classroom"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={(text) => { setSearchQuery(text); handleSearch(text); }}
          />
        </View>

        {filteredClassrooms.map(room => (
          <View key={room.id} style={styles.roomRow}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedClassroom(room)}>
              <Text style={styles.roomRowName}>Room {room.roomNumber} — {room.name}</Text>
              <Text style={styles.roomRowSub}>{room.building} · {room.roomType || "Lecture"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.roomAddBtn}
              onPress={() => openActionMenu(room)}
            >
              <Text style={styles.roomAddBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        ))}
      </BottomSheetScrollView>
    );
  };

  const renderClassroomDetail = () => {
    if (!selectedClassroom) return null;
    const isFav = favoriteClassrooms.has(selectedClassroom.id);
    return (
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <View style={styles.bdHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bdTitle}>{selectedClassroom.name}</Text>
            <Text style={styles.bdSubtitle}>Classroom</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedClassroom(null)} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.navButton} onPress={() => startNavigation(selectedClassroom)}>
            <Image source={require("@/assets/images/walking_icon.png")} style={styles.navIcon} />
            <Text style={styles.navButtonText}>start navigation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBuildingBtn, isFav && styles.addBtnActive]}
            onPress={() => openActionMenu(selectedClassroom)}
          >
            <Text style={[styles.addBuildingText, isFav && styles.addBtnTextActive]}>
              {isFav ? "✓ Added" : "Add"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.bdSectionHeading}>About</Text>
        <View style={styles.detailCard}>
          <DetailRow label="Building" value={selectedClassroom.building} />
          <DetailRow label="Room Type" value={selectedClassroom.roomType || "—"} />
          <DetailRow label="Capacity" value={String(selectedClassroom.maxCapacity || selectedClassroom.defaultCapacity || "—")} />
        </View>

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
      </BottomSheetScrollView>
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
        minZoomLevel={10}
        maxZoomLevel={21}
        onRegionChangeComplete={(region) => {
          const clampedLat = Math.min(33.8850, Math.max(33.8771, region.latitude));
          const clampedLng = Math.min(-117.8817, Math.max(-117.8903, region.longitude));
          if (clampedLat !== region.latitude || clampedLng !== region.longitude) {
            const snapped = { ...region, latitude: clampedLat, longitude: clampedLng };
            mapRef.current?.animateToRegion(snapped, 300);
            setMapRegion(snapped);
          } else {
            setMapRegion(region);
          }
        }}
      >

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

      {selectedBuilding?.id === "cs" && (
        <TouchableOpacity style={styles.floorLayoutButton} onPress={() => router.push("/floorplan")}>
          <Text style={styles.floorLayoutButtonText}>View Floor Layout</Text>
        </TouchableOpacity>
      )}

      {/* bottom sheet with glass background */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        handleIndicatorStyle={styles.handle}
        enablePanDownToClose={false}
        backgroundComponent={({ style }: BottomSheetBackgroundProps) => (
          <BlurView
            intensity={70}
            tint="light"
            style={[style, { borderTopLeftRadius: 34, borderTopRightRadius: 34, overflow: "hidden" }]}
          />
        )}
      >
        <View style={styles.container}>
          <View style={styles.sheetContent}>

            {selectedClassroom ? (
              renderClassroomDetail()
            ) : selectedBuilding ? (
              renderBuildingDetail()
            ) : (
              <>
                {/* glass search bar */}
                <View style={styles.searchContainer}>
                  <Image
                    source={require("@/assets/images/search_icon.png")}
                    style={styles.searchIconImg}
                  />
                  <BottomSheetTextInput
                    style={styles.searchInput}
                    placeholder="Search Campus"
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      handleSearch(text);
                    }}
                  />
                </View>

                {/* filter tabs — only show when not drilled into a building */}
                {!selectedBuilding && (
                  <View style={styles.filterRow}>
                    <TouchableOpacity
                      style={[styles.filterTab, activeFilter === "classes" && styles.filterTabActive]}
                      onPress={() => setActiveFilter("classes")}
                    >
                      <Text style={[styles.filterTabText, activeFilter === "classes" && styles.filterTabTextActive]}>Classes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterTab, activeFilter === "buildings" && styles.filterTabActive]}
                      onPress={() => setActiveFilter("buildings")}
                    >
                      <Text style={[styles.filterTabText, activeFilter === "buildings" && styles.filterTabTextActive]}>Building</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterTab, activeFilter === "schedule" && styles.filterTabActive]}
                      onPress={() => setActiveFilter("schedule")}
                    >
                      <Text style={[styles.filterTabText, activeFilter === "schedule" && styles.filterTabTextActive]}>Schedule</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {activeFilter === "schedule" ? (
                  renderScheduleView()
                ) : activeFilter === "buildings" ? (
                  /* building list — all by default, filtered when searching */
                  <BottomSheetFlatList
                    data={searchQuery ? filter : buildings}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.recentItem} onPress={() => handleBuildingPress(item)}>
                        <Image source={require("@/assets/images/building_icon.png")} style={styles.buildingListIcon} />
                        <View>
                          <Text style={styles.recentItemName}>{item.name}</Text>
                          <Text style={styles.recentItemSub}>building · {item.code}</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.listContent}
                  />
                ) : !searchQuery ? (
                  <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text style={styles.sectionHeader}>Favorites</Text>
                    {favoriteClassrooms.size === 0 ? (
                      <Text style={styles.emptyStateText}>No favorites yet</Text>
                    ) : (
                      allClassrooms
                        .filter(c => favoriteClassrooms.has(c.id))
                        .map(c => (
                          <TouchableOpacity key={c.id} style={styles.recentItem} onPress={() => setSelectedClassroom(c)}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.recentItemName}>{c.name}</Text>
                              <Text style={styles.recentItemSub}>{c.building} · {c.roomType || "Classroom"}</Text>
                            </View>
                            <TouchableOpacity style={styles.roomAddBtn} onPress={() => openActionMenu(c)}>
                              <Text style={styles.roomAddBtnText}>•••</Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        ))
                    )}

                    <Text style={styles.sectionHeader}>Recent</Text>
                    {recentBuildings.length === 0 ? (
                      <Text style={styles.emptyStateText}>No recent searches</Text>
                    ) : (
                      recentBuildings.map(b => (
                        <TouchableOpacity key={b.id} style={styles.recentItem} onPress={() => handleBuildingPress(b)}>
                          <Image source={require("@/assets/images/building_icon.png")} style={styles.buildingListIcon} />
                          <View>
                            <Text style={styles.recentItemName}>{b.name}</Text>
                            <Text style={styles.recentItemSub}>building</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </BottomSheetScrollView>
                ) : loading ? (
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

      {/* ── Navigation start overlay ── */}
      <Modal transparent animationType="fade" visible={showNavOverlay}>
        <LinearGradient
          colors={["#F2F2F2", "#5797F7"]}
          locations={[0, 0.58]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.navOverlayContainer}
        >
          <Image
            source={require("@/assets/images/location_icon.png")}
            style={styles.navPin}
            resizeMode="contain"
          />

          <Text style={styles.navOverlayTitle}>starting indoor{"\n"}navigation to:</Text>
          <Text style={styles.navOverlayRoom}>{navTargetName}</Text>
        </LinearGradient>
      </Modal>

      {/* ── Action menu: Favorite or Schedule ── */}
      <Modal transparent animationType="fade" visible={showActionMenu} onRequestClose={() => setShowActionMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowActionMenu(false)}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.menuCard}>
            {actionMenuRoom && (
              <Text style={styles.menuRoomLabel}>{actionMenuRoom.name}</Text>
            )}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                if (actionMenuRoom) toggleFavoriteClassroom(actionMenuRoom.id);
                setShowActionMenu(false);
              }}
            >
              <Text style={styles.menuItemText}>
                {actionMenuRoom && favoriteClassrooms.has(actionMenuRoom.id)
                  ? "Remove from Favorites"
                  : "Add to Favorites"}
              </Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowActionMenu(false);
                if (actionMenuRoom) openScheduleModal(actionMenuRoom);
              }}
            >
              <Text style={styles.menuItemText}>Add to Schedule</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowActionMenu(false)}>
              <Text style={[styles.menuItemText, { color: "#8E8E93" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Schedule form modal ── */}
      <Modal transparent animationType="slide" visible={showScheduleModal} onRequestClose={() => setShowScheduleModal(false)}>
        <KeyboardAvoidingView style={styles.modalOuter} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowScheduleModal(false)}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          </TouchableOpacity>
          <View style={styles.scheduleFormCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add to Schedule</Text>
            {schedulingRoom && (
              <Text style={styles.modalSubtitle}>{schedulingRoom.name} · Room {schedulingRoom.roomNumber}</Text>
            )}

            <Text style={styles.modalLabel}>Class Name</Text>
            <View style={styles.modalInputBox}>
              <TextInput
                value={scheduleForm.customName}
                onChangeText={t => setScheduleForm(f => ({ ...f, customName: t }))}
                placeholder="e.g. CPSC 131"
                placeholderTextColor="#9CA3AF"
                style={styles.modalInputText}
              />
            </View>

            <Text style={styles.modalLabel}>Days</Text>
            <View style={styles.dayRow}>
              {DAYS.map(day => {
                const active = scheduleForm.days.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayBtn, active && styles.dayBtnActive]}
                    onPress={() => setScheduleForm(f => ({
                      ...f,
                      days: active ? f.days.filter(d => d !== day) : [...f.days, day],
                    }))}
                  >
                    <Text style={[styles.dayBtnText, active && styles.dayBtnTextActive]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Start Time</Text>
                <View style={styles.modalInputBox}>
                  <TextInput
                    value={scheduleForm.startTime}
                    onChangeText={t => setScheduleForm(f => ({ ...f, startTime: t }))}
                    placeholder="9:00 AM"
                    placeholderTextColor="#9CA3AF"
                    style={styles.modalInputText}
                  />
                </View>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>End Time</Text>
                <View style={styles.modalInputBox}>
                  <TextInput
                    value={scheduleForm.endTime}
                    onChangeText={t => setScheduleForm(f => ({ ...f, endTime: t }))}
                    placeholder="10:15 AM"
                    placeholderTextColor="#9CA3AF"
                    style={styles.modalInputText}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowScheduleModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveScheduleEntry}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
    top: 60,
    right: 20,
    alignItems: "flex-end",
  },

  locationPill: {
    minWidth: 140,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.80)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  locationPillText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#272BA0",
  },

  zoomRow: {
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.80)",
    shadowColor: "#000",
    shadowOpacity: 0.28,
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
    backgroundColor: "transparent",
  },

  handle: {
    width: 145,
    height: 6,
    backgroundColor: "#999999",
    borderRadius: 8,
    marginBottom: 25,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(87,151,247,0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },

  searchIconImg: {
    width: 18,
    height: 18,
    resizeMode: "contain",
    marginRight: 10,
    opacity: 0.55,
    tintColor: "#5797F7",
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#2C2C2C",
    height: "100%",
  },

  filterRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },

  filterTab: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.70)",
    borderWidth: 1,
    borderColor: "rgba(87,151,247,0.25)",
  },

  filterTabActive: {
    backgroundColor: "#5797F7",
    borderColor: "#5797F7",
  },

  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5797F7",
  },

  filterTabTextActive: {
    color: "#fff",
  },

  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 6,
  },

  emptyStateText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginHorizontal: 20,
    marginBottom: 8,
  },

  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },

  buildingListIcon: {
    width: 36,
    height: 36,
    resizeMode: "contain",
    marginRight: 12,
    tintColor: "#335991",
  },

  recentItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },

  recentItemSub: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
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

  bdHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },

  bdTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1C1E",
  },

  bdSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 2,
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(120,120,128,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  closeBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3C3C43",
  },

  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },

  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5797F7",
    borderRadius: 14,
    paddingVertical: 13,
    gap: 8,
  },

  navIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
    tintColor: "#fff",
  },

  navButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },

  addBuildingBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    paddingVertical: 13,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },

  addBtnActive: {
    backgroundColor: "#5797F7",
    borderColor: "#5797F7",
  },

  addBuildingDots: {
    fontSize: 13,
    color: "#1C1C1E",
    letterSpacing: 1,
  },

  addBuildingText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
  },

  addBtnTextActive: {
    color: "#fff",
  },

  buildingPhoto: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
    borderRadius: 16,
    marginHorizontal: 0,
    marginBottom: 16,
    alignSelf: "stretch",
  },

  bdSectionHeading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1C1E",
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
  },

  aboutCard: {
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  aboutText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#3C3C43",
  },

  classroomSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    height: 44,
    backgroundColor: "rgba(118,118,128,0.12)",
    borderRadius: 22,
    paddingHorizontal: 14,
    marginBottom: 8,
  },

  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },

  roomRowName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },

  roomRowSub: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },

  roomAddBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "rgba(255,255,255,0.85)",
  },

  roomAddBtnActive: {
    backgroundColor: "#5797F7",
    borderColor: "#5797F7",
  },

  roomAddBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },

  roomAddBtnTextActive: {
    color: "#fff",
  },

  // ── Schedule view ──
  emptySchedule: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyScheduleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  emptyScheduleText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 20,
  },
  scheduleEntry: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(87,151,247,0.13)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  scheduleEntryName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  scheduleEntryRoom: {
    fontSize: 13,
    color: "#5797F7",
    marginBottom: 2,
  },
  scheduleEntryMeta: {
    fontSize: 13,
    color: "#8E8E93",
  },
  scheduleEntryRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(120,120,128,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  scheduleEntryRemoveText: {
    fontSize: 13,
    color: "#3C3C43",
    fontWeight: "600",
  },

  // ── Action menu modal ──
  menuOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 34,
    paddingHorizontal: 16,
  },
  menuCard: {
    backgroundColor: "rgba(250,250,252,0.95)",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  menuRoomLabel: {
    textAlign: "center",
    fontSize: 13,
    color: "#8E8E93",
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 17,
    color: "#5797F7",
    fontWeight: "500",
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.12)",
    marginHorizontal: 0,
  },

  // ── Schedule form modal ──
  modalOuter: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scheduleFormCard: {
    backgroundColor: "rgba(248,250,255,0.97)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5797F7",
    marginBottom: 6,
    marginTop: 14,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  modalInputBox: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(87,151,247,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalInputText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  dayRow: {
    flexDirection: "row",
    gap: 8,
  },
  dayBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "rgba(87,151,247,0.22)",
  },
  dayBtnActive: {
    backgroundColor: "#5797F7",
    borderColor: "#5797F7",
  },
  dayBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5797F7",
  },
  dayBtnTextActive: {
    color: "#fff",
  },
  timeRow: {
    flexDirection: "row",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(120,120,128,0.12)",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C3C43",
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#5797F7",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },

  floorLayoutButton: {
    position: "absolute",
    bottom: "22%",
    alignSelf: "center",
    backgroundColor: "#272BA0",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  navOverlayContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navPin: {
    width: 100,
    height: 100,
    marginBottom: 32,
  },
  navOverlayTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#272BA0",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 16,
  },
  navOverlayRoom: {
    fontSize: 22,
    fontWeight: "700",
    color: "#272BA0",
    textAlign: "center",
    opacity: 0.85,
    paddingHorizontal: 32,
  },

  floorLayoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },


});
