import { Stack, useRouter } from "expo-router";


export default function RootLayout() {
  const router = useRouter();


  return (
    <Stack>
      <Stack.Screen name="db-testing" options={{ headerShown: false}} />
      <Stack.Screen name="test" options={{ headerShown: false}} />
      <Stack.Screen name = "register" options={{ headerShown: false}} />
    </Stack>

  );
}
