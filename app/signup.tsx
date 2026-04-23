import CSUFButton from "@/components/CSUFButton";
import { auth, db } from '@/components/firebaseConfig';
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
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

export default function Signup() {
  const { width } = useWindowDimensions();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const updateField = (field: any, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }
  
  const [error, setError] = useState('');

  const BASE_W = 402;
  const s = useMemo(() => width / BASE_W, [width]);
  const px = (n: number) => Math.round(n * s);

  const validate = () => {
    if (!form.firstName || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (form.password !== form.confirmPassword){
      setError('Passwords do not match');
      return false;
    }
    return true;

  };

  const handleCreateAccount = async () => {
    if (!validate()) return;

    setError('');
    try {
      const userCreds = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const uid = userCreds.user.uid;

      await setDoc(doc(db, 'users', uid), {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        createdAt: serverTimestamp(),
      });

      router.push({
        pathname: "/welcome",
        params: { from: "signup" },
      });

    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } 

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

  const getErrorMessage = (code: any) => {
    switch (code) {
      case 'auth/email-already-in-use': return 'An account with this email already exists';
      case 'auth/invalid-email': return 'Invalid email address';
      case 'auth/weak-password': return 'Password is too weak';
      default: return 'Registration failed.';
    }
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
            <ThemedText type="title"
              style={{
                top: px(220),
                fontSize: px(34),
              }}
            >
              create an account
            </ThemedText>

            {/* Glass card */}
            <ThemedView type="glass"
              style={{
                height: px(707),
                top: px(300),
              }}
            />

            {error ? <ThemedText type="label"
              style={{
                top: px(315),
              }}>{error}</ThemedText> : null}

            {/* First name */}
            <ThemedText type="label"
              style={{
                top: px(345),
              }}
            >
              first name
            </ThemedText>

            <ThemedView type="input"
              style={{
                top: px(377),
              }}
            >
              <TextInput
                value={form.firstName}
                onChangeText={(val) => updateField('firstName', val)}
                placeholder="First Name Here"
                placeholderTextColor="#CFCFCF"
                style={{
                  fontSize: px(13),
                  fontWeight: "500",
                  color: "#2C2C2C",
                }}
                autoCapitalize='words'
              />
            </ThemedView>

            {/* Last name */}
            <ThemedText type="label"
              style={{
                top: px(442),
              }}
            >
              last name
            </ThemedText>

            <ThemedView type="input"
              style={{
                top: px(474),
              }}
            >
              <TextInput
                value={form.lastName}
                onChangeText={(val) => updateField('lastName', val)}
                placeholder="Last Name Here"
                placeholderTextColor="#CFCFCF"
                style={{
                  fontSize: px(13),
                  fontWeight: "500",
                  color: "#2C2C2C",
                }}
                autoCapitalize='words'
              />
            </ThemedView>

            {/* Email */}
            <ThemedText type="label"
              style={{
                top: px(539),
              }}
            >
              email address
            </ThemedText>

            <ThemedView type="input"
              style={{
                top: px(571),
              }}
            >
              <TextInput
                value={form.email}
                onChangeText={(val) => updateField('email', val)}
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

            {/* Password */}
            <ThemedText type="label"
              style={{
                top: px(636),
              }}
            >
              password
            </ThemedText>

            <ThemedView type="input"
              style={{
                top: px(668),
              }}
            >
              <TextInput
                value={form.password}
                onChangeText={(val) => updateField('password', val)}
                placeholder="Password must be 6 characters"
                placeholderTextColor="#CFCFCF"
                secureTextEntry
                style={{
                  fontSize: px(13),
                  fontWeight: "500",
                  color: "#2C2C2C",
                }}
              />
            </ThemedView>

             {/* Confirm Password */}
            <ThemedText type="label"
              style={{
                top: px(733),
              }}
            >
              Confirm Password
            </ThemedText>

            <ThemedView type="input"
              style={{
                top: px(765),
              }}
            >
              <TextInput
                value={form.confirmPassword}
                onChangeText={(val) => updateField('confirmPassword', val)}
                placeholder="Confirm Password"
                placeholderTextColor="#CFCFCF"
                secureTextEntry
                style={{
                  fontSize: px(13),
                  fontWeight: "500",
                  color: "#2C2C2C",
                }}
              />
            </ThemedView>

            {/* Sign up button */}
            <CSUFButton
              title="Sign Up"
              onPress={handleCreateAccount}
              variant="figmaSmall"
              style={{
                position: "absolute",
                left: px(106),
                top: px(842),
              }}
            />

            {/* Already have an account */}
            <View
              style={{
                position: "absolute",
                left: px(89),
                top: px(907),
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: px(14), fontWeight: "400", color: "#000" }}
              >
                Already have an account?
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
                top: px(937),
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