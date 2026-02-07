import { ThemedText } from '@/components/themed-text';
import { Link } from "expo-router";
import { Button, View } from "react-native";


export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ThemedText type='default'>Edit app/index.tsx to edit this screen.</ThemedText>
      <Link href = '/test'>
        <Button title = 'next page'/>
      </Link>
    </View>

  );
}
