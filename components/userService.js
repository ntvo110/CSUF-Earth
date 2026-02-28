import { db } from '@/components/firebaseConfig';
import { doc } from 'firebase/firestore';

export const getUserById = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data()};
    } else {
        console.log('No user found with that ID');
        return null;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};