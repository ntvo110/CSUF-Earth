import { auth, db } from '@/components/firebaseConfig';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';


export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');



  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
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

      router.push('/test');

    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
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

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      {error ? <Text>{error}</Text> : null}
      <Text>Sign in</Text>

      <TextInput
        placeholder='Email'
        value = {email}
        onChangeText = {setEmail}
      />
      
      <TextInput 
        placeholder = 'Password'
        value = {password}
        onChangeText = {setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
        ? <ActivityIndicator color="#ff1515"/>
        : <Text>Sign-in</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}