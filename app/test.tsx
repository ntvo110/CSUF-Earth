import { Link } from 'expo-router';
import { Button, View } from 'react-native';



export default function TestScreen() {
    return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
            >
            <Link href = '/'>
                <Button title = 'to home'/>
            </Link>
        </View>
    );
}