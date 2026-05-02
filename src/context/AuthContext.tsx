import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, getDoc, setDoc, serverTimestamp, 
  collection, query, where, onSnapshot, orderBy, limit 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';
import { toast } from '../components/ui/Toaster';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          const isAdminEmail = user.email === 'vanquyen607@gmail.com' || user.email === 'admin@bento.tea' || user.email === 'vq607@gmail.com';
          
          if (profileDoc.exists()) {
            const currentProfile = profileDoc.data() as UserProfile;
            
            // If they should be admin but aren't, update them
            if (isAdminEmail && currentProfile.role !== 'admin') {
              await setDoc(doc(db, 'users', user.uid), { 
                role: 'admin',
                updatedAt: serverTimestamp() 
              }, { merge: true });
              setProfile({ ...currentProfile, role: 'admin' });
            } else {
              setProfile(currentProfile);
            }
          } else {
            // Auto-assign admin for specific emails
            const newProfile: any = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Khách hàng',
              photoURL: user.photoURL || '',
              role: isAdminEmail ? 'admin' : 'customer',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setProfile(newProfile);
          }

          // Real-time notification listener for order status changes
          const ordersQuery = query(
            collection(db, 'orders'),
            where('customerId', '==', user.uid),
            orderBy('updatedAt', 'desc'),
            limit(5)
          );

          unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'modified') {
                const orderData = change.doc.data();
                
                if (orderData.status === 'completed') {
                  toast.success(`Đơn hàng #${change.doc.id.slice(-6).toUpperCase()} đã hoàn thành! 🥤`);
                } else if (orderData.status === 'processing') {
                  toast.info(`Đơn hàng #${change.doc.id.slice(-6).toUpperCase()} đang được pha chế!`);
                }
              }
            });
          }, (err) => {
             handleFirestoreError(err, OperationType.LIST, 'orders_notifications');
          });

        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setProfile(null);
        if (unsubscribeOrders) unsubscribeOrders();
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: name });
    
    const isAdminEmail = email === 'vanquyen607@gmail.com' || email === 'admin@bento.tea' || email === 'vq607@gmail.com';

    const initialProfile: any = {
      uid: user.uid,
      email: user.email || '',
      displayName: name,
      photoURL: '',
      role: isAdminEmail ? 'admin' : 'customer',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    try {
      // Use merge: true to avoid issues with onAuthStateChanged race conditions
      await setDoc(doc(db, 'users', user.uid), initialProfile, { merge: true });
      setProfile(initialProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin, 
      login, 
      loginWithEmail, 
      registerWithEmail, 
      logout,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
