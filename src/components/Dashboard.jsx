import React, { useState, useEffect } from "react";
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getAllTasks,
  createTask,
  updateTaskStatus,
  assignTask,
  getActivityLog,
  generateReport,
  searchUsers,
  filterUsersByRole,
  logoutUser,
} from "../utils/firebase-config";
import "./Dashboard.css";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardStats, setDashboardStats] = useState({});
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  // Form states
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    deadline: "",
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    projectId: "",
    priority: "medium",
  });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, projectsRes, tasksRes, activitiesRes] =
        await Promise.all([
          getDashboardStats(),
          getAllUsers(),
          getAllProjects(),
          getAllTasks(),
          getActivityLog(),
        ]);

      if (statsRes.success) setDashboardStats(statsRes.data);
      if (statsRes.success) setActivities(statsRes?.data?.recentActivity);
      if (usersRes.success) setUsers(usersRes.data);
      if (projectsRes.success) setProjects(projectsRes.data);
      if (tasksRes.success) setTasks(tasksRes.data);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };
  console.log(dashboardStats, "dnjhcbdjhkcbdkbcbk");

  const handleUserStatusChange = async (userId, isActive) => {
    const result = await updateUserStatus(userId, isActive);
    if (result.success) {
      setUsers(
        users.map((user) => (user.id === userId ? { ...user, isActive } : user))
      );
    } else {
      setError(result.message);
    }
  };

  const handleUserRoleChange = async (userId, newRole) => {
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } else {
      setError(result.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      const result = await deleteUser(userId);
      if (result.success) {
        setUsers(users.filter((user) => user.id !== userId));
      } else {
        setError(result.message);
      }
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const result = await createProject(projectForm);
    if (result.success) {
      setProjectForm({ name: "", description: "", deadline: "" });
      setShowProjectForm(false);
      loadDashboardData();
    } else {
      setError(result.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      const result = await deleteProject(projectId);
      if (result.success) {
        setProjects(projects.filter((project) => project.id !== projectId));
      } else {
        setError(result.message);
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const result = await createTask(taskForm);
    if (result.success) {
      setTaskForm({
        title: "",
        description: "",
        projectId: "",
        priority: "medium",
      });
      setShowTaskForm(false);
      loadDashboardData();
    } else {
      setError(result.message);
    }
  };

  const handleTaskStatusChange = async (taskId, status) => {
    const result = await updateTaskStatus(taskId, status);
    if (result.success) {
      setTasks(
        tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
      );
    } else {
      setError(result.message);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      const result = await searchUsers(searchTerm);
      if (result.success) setUsers(result.data);
    } else {
      loadDashboardData();
    }
  };

  const handleRoleFilter = async (role) => {
    setSelectedRole(role);
    if (role) {
      const result = await filterUsersByRole(role);
      if (result.success) setUsers(result.data);
    } else {
      loadDashboardData();
    }
  };

  const generateReportHandler = async (reportType) => {
    const result = await generateReport(reportType, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    });
    if (result.success) {
      console.log("Report generated:", result.data);
    } else {
      setError(result.message);
    }
  };

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      // User will be automatically redirected to login page due to auth state change
      console.log("Logged out successfully");
    } else {
      setError(result.message);
    }
  };

  const renderOverview = () => (
    <div className="overview-section">
      <h2>Dashboard Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{dashboardStats.totalUsers || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <p className="stat-number">{dashboardStats.activeUsers || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Projects</h3>
          <p className="stat-number">{dashboardStats.totalProjects || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Completed Tasks</h3>
          <p className="stat-number">{dashboardStats.completedTasks || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Tasks</h3>
          <p className="stat-number">{dashboardStats.pendingTasks || 0}</p>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="users-section">
      <h2>User Management</h2>
      <div className="user-controls">
        <select
          value={selectedRole}
          onChange={(e) => handleRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select>
      </div>
      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.firstName}</td>
              <td>{user.email}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) =>
                    handleUserRoleChange(user.id, e.target.value)
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                </select>
              </td>
              <td>
                <button
                  className={`status-btn ${
                    user.isActive ? "active" : "inactive"
                  }`}
                  onClick={() =>
                    handleUserStatusChange(user.id, !user.isActive)
                  }
                >
                  {user.isActive ? "Active" : "Inactive"}
                </button>
              </td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderProjects = () => (
    <div className="projects-section">
      <h2>Project Management</h2>
      <button onClick={() => setShowProjectForm(true)}>
        Create New Project
      </button>

      {showProjectForm && (
        <form onSubmit={handleCreateProject} className="project-form">
          <input
            type="text"
            placeholder="Project Name"
            value={projectForm.name}
            onChange={(e) =>
              setProjectForm({ ...projectForm, name: e.target.value })
            }
            required
          />
          <textarea
            placeholder="Project Description"
            value={projectForm.description}
            onChange={(e) =>
              setProjectForm({ ...projectForm, description: e.target.value })
            }
            required
          />
          <input
            type="date"
            value={projectForm.deadline}
            onChange={(e) =>
              setProjectForm({ ...projectForm, deadline: e.target.value })
            }
            required
          />
          <button type="submit">Create Project</button>
          <button type="button" onClick={() => setShowProjectForm(false)}>
            Cancel
          </button>
        </form>
      )}

      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <h3>Name:-{project.name}</h3>
            <p>Desc:-{project.description}</p>
            {/* <p>Status: {project.status}</p>
            <p>Progress: {project.progress}%</p> */}
            <button onClick={() => handleDeleteProject(project.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="tasks-section">
      <h2>Task Management</h2>
      <button onClick={() => setShowTaskForm(true)}>Create New Task</button>

      {showTaskForm && (
        <form onSubmit={handleCreateTask} className="task-form">
          <input
            type="text"
            placeholder="Task Title"
            value={taskForm.title}
            onChange={(e) =>
              setTaskForm({ ...taskForm, title: e.target.value })
            }
            required
          />
          <textarea
            placeholder="Task Description"
            value={taskForm.description}
            onChange={(e) =>
              setTaskForm({ ...taskForm, description: e.target.value })
            }
            required
          />
          <select
            value={taskForm.projectId}
            onChange={(e) =>
              setTaskForm({ ...taskForm, projectId: e.target.value })
            }
            required
          >
            <option value="">Select Project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            value={taskForm.priority}
            onChange={(e) =>
              setTaskForm({ ...taskForm, priority: e.target.value })
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button type="submit">Create Task</button>
          <button type="button" onClick={() => setShowTaskForm(false)}>
            Cancel
          </button>
        </form>
      )}

      <div className="tasks-list">
        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            <h4>{task.title}</h4>
            <p>{task.description}</p>
            <p>Priority: {task.priority}</p>
            <select
              value={task.status}
              onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActivities = () => (
    <div className="activities-section">
      <h2>Activity Log</h2>
      <div className="activities-list">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <p>
              <strong>{activity.type}:</strong> {activity.description}
            </p>
            <p className="activity-time">
              {activity.timestamp &&
                new Date(activity.timestamp.seconds * 1000).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <h1>Dashboard</h1>
        <ul>
          <li>
            <button
              onClick={() => setActiveTab("overview")}
              className={activeTab === "overview" ? "active" : ""}
            >
              Overview
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("users")}
              className={activeTab === "users" ? "active" : ""}
            >
              Users
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("projects")}
              className={activeTab === "projects" ? "active" : ""}
            >
              Projects
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("tasks")}
              className={activeTab === "tasks" ? "active" : ""}
            >
              Tasks
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("activities")}
              className={activeTab === "activities" ? "active" : ""}
            >
              Activities
            </button>
          </li>
        </ul>
        <div className="logout-section">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}

        {activeTab === "overview" && renderOverview()}
        {activeTab === "users" && renderUsers()}
        {activeTab === "projects" && renderProjects()}
        {activeTab === "tasks" && renderTasks()}
        {activeTab === "activities" && renderActivities()}
      </main>
    </div>
  );
};

export default Dashboard;
