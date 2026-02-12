import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import CSUFButton from "../components/CSUFButton";



export default function Login() {
  const { width, height } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Figma export base width = 402 (iPhone 16 Pro/Max frame in your code)
  const BASE_W = 402;
  const s = useMemo(() => width / BASE_W, [width]);
  const px = (n: number) => Math.round(n * s);

  const handleLogin = () => {
  router.push({
    pathname: "/welcome",
    params: { from: "login" },
  });
  };

  const handleGuest = () => {
  router.push({
    pathname: "/welcome",
    params: { from: "login" },
  });
  };


  const handleSignUp = () => {
    // If you make a signup screen later, switch to:
    // router.push("/signup");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.stage, { width, height }]}>
          {/* Background color */}
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#F2F2F2" }]} />

          {/* Bottom gradient blob (from your Figma code) */}
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
              top: px(657),
              borderRadius: 9999,
            }}
          />

          {/* Orange icon placeholder (replace later with SVG if you want) */}
          <View
            style={{
              position: "absolute",
              width: px(96),
              height: px(96),
              left: px(150),
              top: px(164),
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

          {/* CSUF text */}
          <Text
            style={{
              position: "absolute",
              width: px(320),
              height: px(66),
              left: px(40),
              top: px(293),
              textAlign: "center",
              color: "#272BA0",
              fontSize: px(48),
              fontWeight: "500",
            }}
          >
            CSUF
          </Text>

          {/* Glass card */}
          <View
            style={{
              position: "absolute",
              width: px(320),
              height: px(361),
              left: px(40),
              top: px(352),
              borderRadius: px(34),
              backgroundColor: "rgba(250,250,250,0.70)",
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: px(20),
              shadowOffset: { width: px(10), height: px(12) },
              elevation: 6,
            }}
          />

          {/* Email label */}
          <Text
            style={{
              position: "absolute",
              left: px(63),
              top: px(390),
              fontSize: px(16),
              fontWeight: "500",
              color: "#2C2C2C",
            }}
          >
            email address
          </Text>

          {/* Email input */}
          <View
            style={{
              position: "absolute",
              width: px(272),
              height: px(40),
              left: px(62),
              top: px(422),
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

          {/* Password label */}
          <Text
            style={{
              position: "absolute",
              left: px(63),
              top: px(480),
              fontSize: px(16),
              fontWeight: "500",
              color: "#2C2C2C",
            }}
          >
            password
          </Text>

          {/* Password input */}
          <View
            style={{
              position: "absolute",
              width: px(272),
              height: px(40),
              left: px(63),
              top: px(512),
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

          {/* Login button */}
          <CSUFButton
           title="log in"
           onPress={handleLogin}
           variant="figmaSmall"
           style={{
             position: "absolute",
             left: px(106),
              top: px(577),
              }}
/>

          {/* don't have an account? Sign up */}
          <View
            style={{
              position: "absolute",
              left: px(81),
              top: px(642),
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: px(14), fontWeight: "400", color: "#000" }}>
              don’t have an account?
            </Text>
            <Text>{" "}</Text>
            <Text
              onPress={handleSignUp}
              style={{ fontSize: px(14), fontWeight: "700", color: "#000" }}
            >
              Sign up
            </Text>
          </View>

          {/* continue as a guest */}
          <TouchableOpacity
            onPress={handleGuest}
            activeOpacity={0.7}
            style={{
              position: "absolute",
              width: px(182),
              left: px(106),
              top: px(663),
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2F2F2" },
  flex: { flex: 1 },
  stage: { flex: 1, position: "relative" },
});

