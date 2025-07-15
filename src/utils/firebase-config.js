// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';

// Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyBv3hEyH0w-M-rjwsthlWRVAoVZtw07V8I",
  authDomain: "sales-tracter-be.firebaseapp.com",
  projectId: "sales-tracter-be",
  storageBucket: "sales-tracter-be.appspot.com",
  databaseURL: "https://sales-tracter-be.firebaseio.com",
  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Register API
export const registerUser = async (email, password, firstName, role) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Add user details to Firestore 'manager' collection
    await addDoc(collection(db, 'manager'), {
      uid: user.uid,
      email: email,
      firstName: firstName,
      role: role,
      createdAt: new Date().toISOString(),
      isActive: true
    });

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        uid: user.uid,
        email: user.email,
        firstName: firstName,
        role: role
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error.code
    };
  }
};

// Login API with role-based authentication
export const loginUser = async (email, password, requiredRole = null) => {
  try {
    // Sign in user with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user details from Firestore
    const q = query(collection(db, 'manager'), where('uid', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      await signOut(auth); // Sign out if user not found in manager collection
      return {
        success: false,
        message: 'User not found in manager collection'
      };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Check if user is active
    if (!userData.isActive) {
      await signOut(auth);
      return {
        success: false,
        message: 'User account is deactivated'
      };
    }

    // Role-based authentication check
    if (requiredRole && userData.role !== requiredRole) {
      await signOut(auth);
      return {
        success: false,
        message: `Access denied. Required role: ${requiredRole}, User role: ${userData.role}`
      };
    }

    return {
      success: true,
      message: 'Login successful',
      user: {
        uid: user.uid,
        email: user.email,
        firstName: userData.firstName,
        role: userData.role,
        token: await user.getIdToken() // Get Firebase ID token
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error.code
    };
  }
};

// Get user profile
export const getUserProfile = async (uid) => {
  try {
    const q = query(collection(db, 'manager'), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    return {
      success: true,
      user: userData
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Logout API
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

export const getDashboardStats = async () => {
  try {
    const stats = {
      totalUsers: 0,
      activeUsers: 0,
      totalProjects: 0,
      completedTasks: 0,
      pendingTasks: 0,
      recentActivity: []
    };

    // Get user stats
    const usersQuery = query(collection(db, 'manager'));
    const usersSnapshot = await getDocs(usersQuery);
    stats.totalUsers = usersSnapshot.size-1;
    stats.activeUsers = usersSnapshot.docs.filter(doc => doc.data().isActive).length;

    // Get project stats (assuming you have a projects collection)
    const projectsQuery = query(collection(db, 'projects'));
    const projectsSnapshot = await getDocs(projectsQuery);
    stats.totalProjects = projectsSnapshot.size;

    // Get task stats (assuming you have a tasks collection)
    const tasksQuery = query(collection(db, 'tasks'));
    const tasksSnapshot = await getDocs(tasksQuery);
    stats.completedTasks = tasksSnapshot.docs.filter(doc => doc.data().status === 'completed').length;
    stats.pendingTasks = tasksSnapshot.docs.filter(doc => doc.data().status === 'pending').length;

    // Get recent activity
    const activityQuery = query(collection(db, 'activity'), orderBy('timestamp', 'desc'), limit(10));
    const activitySnapshot = await getDocs(activityQuery);
    stats.recentActivity = activitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { success: true, data: stats };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 2. User Management APIs
export const getAllUsers = async (pageSize = 10, lastDoc = null) => {
  try {
    let q = query(collection(db, 'manager'), orderBy('createdAt', 'desc'));
    
    if (pageSize) q = query(q, limit(pageSize));
    if (lastDoc) q = query(q, startAfter(lastDoc));

    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastDoc: doc
    }));

    return { success: true, data: users };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateUserStatus = async (userId, isActive) => {
  try {
    const userRef = doc(db, 'manager', userId);
    await updateDoc(userRef, { isActive });
    
    // Log activity
    await logActivity('user_status_change', `User ${isActive ? 'activated' : 'deactivated'}`, userId);
    
    return { success: true, message: `User ${isActive ? 'activated' : 'deactivated'} successfully` };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateUserRole = async (userId, newRole) => {
  try {
    const userRef = doc(db, 'manager', userId);
    await updateDoc(userRef, { role: newRole });
    
    await logActivity('role_change', `User role changed to ${newRole}`, userId);
    
    return { success: true, message: 'User role updated successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, 'manager', userId));
    await logActivity('user_deleted', 'User deleted from system', userId);
    
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 3. Project Management APIs
export const createProject = async (projectData) => {
  try {
    const project = {
      ...projectData,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid,
      status: 'active',
      progress: 0
    };

    const docRef = await addDoc(collection(db, 'projects'), project);
    await logActivity('project_created', `Project "${projectData.name}" created`, docRef.id);
    
    return { success: true, message: 'Project created successfully', projectId: docRef.id };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getAllProjects = async () => {
  try {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return { success: true, data: projects };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateProject = async (projectId, updateData) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { ...updateData, updatedAt: serverTimestamp() });
    
    await logActivity('project_updated', `Project updated`, projectId);
    
    return { success: true, message: 'Project updated successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteProject = async (projectId) => {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
    await logActivity('project_deleted', 'Project deleted', projectId);
    
    return { success: true, message: 'Project deleted successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 4. Task Management APIs
export const createTask = async (taskData) => {
  try {
    const task = {
      ...taskData,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid,
      status: 'pending'
    };

    const docRef = await addDoc(collection(db, 'tasks'), task);
    await logActivity('task_created', `Task "${taskData.title}" created`, docRef.id);
    
    return { success: true, message: 'Task created successfully', taskId: docRef.id };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getAllTasks = async (projectId = null) => {
  try {
    let q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    if (projectId) {
      q = query(collection(db, 'tasks'), where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return { success: true, data: tasks };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateTaskStatus = async (taskId, status) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { status, updatedAt: serverTimestamp() });
    
    await logActivity('task_status_change', `Task status changed to ${status}`, taskId);
    
    return { success: true, message: 'Task status updated successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const assignTask = async (taskId, assignedTo) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { assignedTo, updatedAt: serverTimestamp() });
    
    await logActivity('task_assigned', `Task assigned to user`, taskId);
    
    return { success: true, message: 'Task assigned successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 5. Activity Logging API
export const logActivity = async (type, description, relatedId = null) => {
  try {
    await addDoc(collection(db, 'activity'), {
      type,
      description,
      relatedId,
      userId: auth.currentUser?.uid,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const getActivityLog = async (limit = 50) => {
  try {
    const q = query(collection(db, 'activity'), orderBy('timestamp', 'desc'), limit(limit));
    const querySnapshot = await getDocs(q);
    const activities = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return { success: true, data: activities };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 6. Reports API
export const generateReport = async (reportType, dateRange) => {
  try {
    const report = {
      type: reportType,
      dateRange,
      generatedAt: new Date().toISOString(),
      generatedBy: auth.currentUser?.uid
    };

    switch (reportType) {
      case 'user_activity':
        report.data = await getUserActivityReport(dateRange);
        break;
      case 'project_progress':
        report.data = await getProjectProgressReport();
        break;
      case 'task_completion':
        report.data = await getTaskCompletionReport(dateRange);
        break;
      default:
        return { success: false, message: 'Invalid report type' };
    }

    return { success: true, data: report };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Helper functions for reports
const getUserActivityReport = async (dateRange) => {
  // Implementation for user activity report
  return { totalUsers: 0, activeUsers: 0, newUsers: 0 };
};

const getProjectProgressReport = async () => {
  // Implementation for project progress report
  return { totalProjects: 0, completedProjects: 0, activeProjects: 0 };
};

const getTaskCompletionReport = async (dateRange) => {
  // Implementation for task completion report
  return { totalTasks: 0, completedTasks: 0, pendingTasks: 0 };
};

// 7. Real-time Updates
export const subscribeToUserChanges = (callback) => {
  const q = query(collection(db, 'manager'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, callback);
};

export const subscribeToProjectChanges = (callback) => {
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, callback);
};

export const subscribeToTaskChanges = (callback) => {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, callback);
};

// 8. Search and Filter APIs
export const searchUsers = async (searchTerm) => {
  try {
    const q = query(collection(db, 'manager'));
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    return { success: true, data: users };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const filterUsersByRole = async (role) => {
  try {
    const q = query(collection(db, 'manager'), where('role', '==', role));
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return { success: true, data: users };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 9. Profile Management
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'manager', userId);
    await updateDoc(userRef, { ...profileData, updatedAt: serverTimestamp() });
    
    await logActivity('profile_updated', 'User profile updated', userId);
    
    return { success: true, message: 'Profile updated successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthStateChanged = (callback) => {
  return auth.onAuthStateChanged(callback);
};

// Example usage:

// Register a new user
/*
const registerResult = await registerUser(
  'john@example.com',
  'password123',
  'John',
  'admin'
);
console.log(registerResult);
*/

// Login with role check
/*
const loginResult = await loginUser(
  'john@example.com',
  'password123',
  'admin' // Required role (optional parameter)
);
console.log(loginResult);
*/

// Login without role check
/*
const loginResult = await loginUser(
  'john@example.com',
  'password123'
);
console.log(loginResult);
*/