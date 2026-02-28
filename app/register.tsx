import { auth, db } from '@/components/firebaseConfig';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Register() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: any, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const validate = () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
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

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      const userCreds = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const uid = userCreds.user.uid;

      await setDoc(doc(db, 'users', uid), {
        name: form.name,
        email: form.email,
        createdAt: serverTimestamp(),
      });

      router.push('/test')
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
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
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
        
      <Text>Create Account</Text>

      {error ? <Text>{error}</Text> : null}

      <Text>Full name</Text>
      <TextInput
        placeholder = "Name"
        value = {form.name}
        onChangeText={(val) => updateField('name', val)}
        autoCapitalize='words'
      />
      <Text>Email</Text>
      <TextInput
        placeholder = "Email"
        value = {form.email}
        onChangeText={(val) => updateField('email', val)}
        autoCapitalize='none'
      />
      <Text>Password</Text>
      <TextInput
        placeholder = "At least 6 characters"
        value = {form.password}
        onChangeText={(val) => updateField('password', val)}
        secureTextEntry
      />
      <Text>Confirm Password</Text>
      <TextInput
        placeholder = "Re-enter your password"
        value = {form.confirmPassword}
        onChangeText={(val) => updateField('confirmPassword', val)}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={handleRegister}
        disabled = {loading}
      >
        {loading
          ? <ActivityIndicator color={"#ff0707"} />
          : <Text>Create Account button</Text>
        }
      </TouchableOpacity>

    </View>
  );
}