import CSUFButton from "@/components/CSUFButton";
import { auth, db } from '@/components/firebaseConfig';
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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



export default function Login() {
  const { width, height } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState('');

  // Figma export base width = 402 (iPhone 16 Pro/Max frame in your code)
  const BASE_W = 402;
  const s = useMemo(() => width / BASE_W, [width]);
  const px = (n: number) => Math.round(n * s);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');


    try {

      const userCreds = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCreds.user.uid;
      const userRef = doc(db, 'users', uid);
      console.log(userRef);
      const userSnap = await getDoc(userRef);
      

      if (!userSnap.exists()) {
        setError('User profile not found in database');
        return;
      }

      const userData = userSnap.data();
      console.log('Logged in user:', userData);

      router.push({
        pathname: "/welcome",
        params: { from: "login" },
      });

    } catch (err: any) {
      setError(getErrorMessage(err.code));
    }
  };

  const getErrorMessage = (code: any) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again later';
      default:
        return 'Login failed.';
    }
  }

  const handleGuest = () => {
  router.push({
    pathname: "/welcome",
    params: { from: "login" },
  });
  };


  const handleSignUp = () => {
  router.push("/signup");
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
          <ThemedText type="title"
            style={{
              height: px(66),
              top: px(293),
              fontSize: px(48),
            }}
          >
            CSUF
          </ThemedText>

          {/* Glass card */}
          <ThemedView type="glass" 
            style={{
              height: px(361),
              top: px(352),
            }}
          />

          {error ? <ThemedText type="label"
            style={{
              top: px(365),
            }}>{error}</ThemedText> : null}

          {/* Email label */}
          <ThemedText type="label"
            style={{
              top: px(390)
            }}
          >
            email address
          </ThemedText>

          {/* Email input */}
          <ThemedView type="input"
            style={{
              top: px(422),  
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
          </ThemedView>

          {/* Password label */}
          <ThemedText type="label"
            style={{
              top: px(480)
            }}
          >
            password
          </ThemedText>

          {/* Password input */}
          <ThemedView type="input"
            style={{
              top: px(512),
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
          </ThemedView>

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
            <ThemedText type="guest">
              continue as a guest
            </ThemedText>
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
