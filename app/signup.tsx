import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import CSUFButton from "../components/CSUFButton";

export default function Signup() {
  const { width } = useWindowDimensions();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const BASE_W = 402;
  const s = useMemo(() => width / BASE_W, [width]);
  const px = (n: number) => Math.round(n * s);

  const handleCreateAccount = () => {
    router.push({
      pathname: "/welcome",
      params: { from: "signup" },
    });
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleGuest = () => {
    router.push({
      pathname: "/welcome",
      params: { from: "signup" },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: px(180) }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.stage, { width, minHeight: px(1020) }]}>
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: "#F2F2F2" },
              ]}
            />

            <LinearGradient
              colors={["#F2F2F2", "#5797F7", "#152948"]}
              locations={[0, 0.42, 0.83]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                position: "absolute",
                width: px(642),
                height: px(506),
                left: px(-120),
                top: px(760),
                borderRadius: 9999,
              }}
            />

            {/* Orange icon placeholder */}
            <View
              style={{
                position: "absolute",
                width: px(96),
                height: px(96),
                left: px(150),
                top: px(110),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: px(64),
                  height: px(80),
                  backgroundColor: "#FF7900",
                  borderRadius: px(32),
                }}
              />
            </View>

            {/* Title */}
            <Text
              style={{
                position: "absolute",
                width: px(320),
                left: px(40),
                top: px(220),
                textAlign: "center",
                color: "#272BA0",
                fontSize: px(34),
                fontWeight: "500",
              }}
            >
              create an account
            </Text>

            {/* Glass card */}
            <View
              style={{
                position: "absolute",
                width: px(320),
                height: px(610),
                left: px(40),
                top: px(300),
                borderRadius: px(34),
                backgroundColor: "rgba(250,250,250,0.70)",
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: px(20),
                shadowOffset: { width: px(10), height: px(12) },
                elevation: 6,
              }}
            />

            {/* First name */}
            <Text
              style={{
                position: "absolute",
                left: px(63),
                top: px(345),
                fontSize: px(16),
                fontWeight: "500",
                color: "#2C2C2C",
              }}
            >
              first name
            </Text>

            <View
              style={{
                position: "absolute",
                width: px(272),
                height: px(40),
                left: px(62),
                top: px(377),
                backgroundColor: "#FFFFFF",
                borderRadius: px(12),
                borderWidth: 1,
                borderColor: "#F2F2F2",
                justifyContent: "center",
                paddingHorizontal: px(12),
              }}
            >
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name Here"
                placeholderTextColor="#CFCFCF"
                style={{
                  fontSize: px(13),
                  fontWeight: "500",
                  color: "#2C2C2C",
                }}
              />
            </View>

            {/* Last name */}
            <Text
              style={{
                position: "absolute",
                left: px(63),
                top: px(442),
                fontSize: px(16),
                fontWeight: "500",
                color: "#2C2C2C",
              }}
            >
              last name
            </Text>

            <View
              style={{
                position: "absolute",
                width: px(272),
                height: px(40),
                left: px(62),
                top: px(474),
                backgroundColor: "#FFFFFF",
                borderRadius: px(12),
                borderWidth: 1,
                borderColor: "#F2F2F2",
                justifyContent: "center",
                paddingHorizontal: px(12),
              }}
            >
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name Here"
                placeholderTextColor="#CFCFCF"
                style={{
                  fontSize: px(13),
                  fontWeight: "500",
                  color: "#2C2C2C",
                }}
              />
            </View>

            {/* Email */}
            <Text
              style={{
                position: "absolute",
                left: px(63),
                top: px(539),
                fontSize: px(16),
                fontWeight: "500",
                color: "#2C2C2C",
              }}
            >
              email address
            </Text>

            <View
              style={{
                position: "absolute",
                width: px(272),
                height: px(40),
                left: px(62),
                top: px(571),
                backgroundColor: "#FFFFFF",
                borderRadius: px(12),
                borderWidth: 1,
                borderColor: "#F2F2F2",
                justifyContent: "center",
                paddingHorizontal: px(12),
              }}
            >
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="example@csu.fullerton.edu"
                placeholderTextColor="#CFCFCF"
                autoCapitalize="none"
                keyboardType="email-address"
                style={{
                  fontSize: px(13),
                  fontWeight: "500",
                  color: "#2C2C2C",
                }}
              />
            </View>

            {/* Password */}
            <Text
              style={{
                position: "absolute",
                left: px(63),
                top: px(636),
                fontSize: px(16),
                fontWeight: "500",
                color: "#2C2C2C",
              }}
            >
              password
            </Text>

            <View
              style={{
                position: "absolute",
                width: px(272),
                height: px(40),
                left: px(62),
                top: px(668),
                backgroundColor: "#FFFFFF",
                borderRadius: px(12),
                borderWidth: 1,
                borderColor: "#F2F2F2",
                justifyContent: "center",
                paddingHorizontal: px(12),
              }}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="abx&sf#rrr"
                placeholderTextColor="#CFCFCF"
                secureTextEntry
                style={{
                  fontSize: px(13),
                  fontWeight: "500",
                  color: "#2C2C2C",
                }}
              />
            </View>

            {/* Sign up button */}
            <CSUFButton
              title="sign up"
              onPress={handleCreateAccount}
              variant="figmaSmall"
              style={{
                position: "absolute",
                left: px(106),
                top: px(745),
              }}
            />

            {/* Already have an account */}
            <View
              style={{
                position: "absolute",
                left: px(89),
                top: px(810),
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: px(14), fontWeight: "400", color: "#000" }}
              >
                Already an account?
              </Text>
              <Text>{"  "}</Text>
              <Text
                onPress={handleLogin}
                style={{ fontSize: px(14), fontWeight: "700", color: "#000" }}
              >
                Log In
              </Text>
            </View>

            {/* Continue as guest */}
            <TouchableOpacity
              onPress={handleGuest}
              activeOpacity={0.7}
              style={{
                position: "absolute",
                width: px(182),
                left: px(106),
                top: px(840),
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontSize: px(14),
                  fontWeight: "500",
                  color: "#000",
                  textDecorationLine: "underline",
                  textShadowColor: "rgba(0,0,0,0.25)",
                  textShadowOffset: { width: 0, height: px(4) },
                  textShadowRadius: px(4),
                }}
              >
                continue as a guest
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2F2F2" },
  flex: { flex: 1 },
  stage: { flex: 1, position: "relative" },
});