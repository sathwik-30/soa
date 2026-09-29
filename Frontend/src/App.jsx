import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:8080";

// =====================================================
// JWT HELPERS
// =====================================================

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    return JSON.parse(atob(padded));
  } catch (error) {
    console.error("JWT decode error:", error);
    return {};
  }
}

function getRoleFromToken(token) {
  const payload = decodeJwt(token);

  return payload.role
    ? String(payload.role).toUpperCase()
    : "USER";
}

// Use browser local date instead of UTC date
function getLocalDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================================
// APP
// =====================================================

function App() {
  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [role, setRole] = useState(
    localStorage.getItem("role") || "USER"
  );

  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );

  // Login
  const [loginUsername, setLoginUsername] =
    useState("");

  const [loginPassword, setLoginPassword] =
    useState("");

  // Registration
  const [registerMode, setRegisterMode] =
    useState(false);

  const [registerUsername, setRegisterUsername] =
    useState("");

  const [registerPassword, setRegisterPassword] =
    useState("");

  // ===================================================
  // GENERAL
  // ===================================================

  const [activeTab, setActiveTab] =
    useState("parking");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ===================================================
  // PARKING
  // ===================================================

  const [slots, setSlots] =
    useState([]);

  const [newSlotNumber, setNewSlotNumber] =
    useState("");

  const [newSlotLocation, setNewSlotLocation] =
    useState("");

  // ===================================================
  // BOOKING
  // ===================================================

  const [bookingSlot, setBookingSlot] =
    useState(null);

  const [latestBooking, setLatestBooking] =
    useState(null);

  const [bookings, setBookings] =
    useState([]);

  // ===================================================
  // BILLING
  // ===================================================

  // ADMIN bills
  const [bills, setBills] =
    useState([]);

  const [billBookingId, setBillBookingId] =
    useState("");

  const [billAmount, setBillAmount] =
    useState("1000");

  // USER bills
  const [myBills, setMyBills] =
    useState([]);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (token) {
      loadParkingSlots(token);

      if (role === "ADMIN") {
        loadAdminData(token);
      }
    }
  }, [token, role]);

  // ===================================================
  // COMMON API REQUEST
  // ===================================================

  const apiRequest = async (
    endpoint,
    options = {}
  ) => {
    const currentToken =
      localStorage.getItem("token");

    const headers = {
      ...(options.body
        ? {
            "Content-Type":
              "application/json",
          }
        : {}),
      ...(options.headers || {}),
    };

    if (currentToken) {
      headers.Authorization =
        `Bearer ${currentToken}`;
    }

    const response = await fetch(
      `${API_BASE}${endpoint}`,
      {
        ...options,
        headers,
      }
    );

    if (response.status === 401) {
      handleLogout();
      throw new Error(
        "Session expired"
      );
    }

    return response;
  };

  // ===================================================
  // LOGIN
  // ===================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            username: loginUsername,
            password: loginPassword,
          }),
        }
      );

      const data =
        await response.text();

      if (!response.ok) {
        setError(
          "Invalid username or password."
        );
        return;
      }

      const userRole =
        getRoleFromToken(data);

      localStorage.setItem(
        "token",
        data
      );

      localStorage.setItem(
        "username",
        loginUsername
      );

      localStorage.setItem(
        "role",
        userRole
      );

      setToken(data);
      setUsername(loginUsername);
      setRole(userRole);

      setLoginPassword("");
      setActiveTab("parking");
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        "Cannot connect to API Gateway. Make sure it is running on port 8080."
      );
    }
  };

  // ===================================================
  // REGISTER
  // ===================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            username:
              registerUsername,
            password:
              registerPassword,
            role: "USER",
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Registration failed."
        );
        return;
      }

      alert(
        "Registration successful! Please login."
      );

      setLoginUsername(
        registerUsername
      );

      setLoginPassword(
        registerPassword
      );

      setRegisterUsername("");
      setRegisterPassword("");

      setRegisterMode(false);
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setError(
        "Cannot connect to Auth Service."
      );
    }
  };

  // ===================================================
  // PARKING - GET ALL
  // ===================================================

  const loadParkingSlots = async (
    jwtToken
  ) => {
    setLoading(true);
    setError("");

    try {
      const response =
        await apiRequest(
          "/parking/slots",
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${jwtToken}`,
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          `Parking API returned ${response.status}`
        );
      }

      const data =
        await response.json();

      setSlots(data);
    } catch (error) {
      console.error(
        "Parking error:",
        error
      );

      if (
        error.message !==
        "Session expired"
      ) {
        setError(
          "Unable to load parking slots."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // BOOKING - CREATE
  // ===================================================

  const handleBooking = async (
    slotId
  ) => {
    setBookingSlot(slotId);
    setError("");

    try {
      const response =
        await apiRequest(
          "/bookings",
          {
            method: "POST",
            body: JSON.stringify({
              username,
              parkingSlotId: slotId,
              bookingDate:
                getLocalDate(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          "Booking failed: " +
            (data.message ||
              "Unable to create booking")
        );
        return;
      }

      setLatestBooking(data);

      alert(
        "Booking successful!\n\n" +
        `Booking ID: ${data.id}\n` +
        `Parking Slot: ${data.parkingSlotId}\n` +
        `Status: ${data.status}`
      );

      await loadParkingSlots(
        token
      );

      setActiveTab(
        "bookings"
      );
    } catch (error) {
      console.error(
        "Booking error:",
        error
      );

      if (
        error.message !==
        "Session expired"
      ) {
        alert(
          "Cannot connect to Booking Service."
        );
      }
    } finally {
      setBookingSlot(null);
    }
  };

  // ===================================================
  // ADMIN - LOAD BOOKINGS + BILLS
  // ===================================================

  const loadAdminData = async (
    jwtToken
  ) => {
    try {
      // Bookings
      const bookingResponse =
        await apiRequest(
          "/bookings",
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${jwtToken}`,
            },
          }
        );

      if (bookingResponse.ok) {
        const bookingData =
          await bookingResponse.json();

        setBookings(
          bookingData
        );
      }

      // Bills
      const billResponse =
        await apiRequest(
          "/billing",
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${jwtToken}`,
            },
          }
        );

      if (billResponse.ok) {
        const billData =
          await billResponse.json();

        setBills(billData);
      }
    } catch (error) {
      console.error(
        "Admin data error:",
        error
      );
    }
  };

  // ===================================================
  // ADMIN - ADD PARKING SLOT
  // ===================================================

  const handleAddSlot = async (
    e
  ) => {
    e.preventDefault();

    if (
      !newSlotNumber.trim() ||
      !newSlotLocation.trim()
    ) {
      setError(
        "Slot number and location are required."
      );
      return;
    }

    setError("");

    try {
      const response =
        await apiRequest(
          "/parking/slots",
          {
            method: "POST",
            body: JSON.stringify({
              slotNumber:
                newSlotNumber.trim(),
              location:
                newSlotLocation.trim(),
              available: true,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to add parking slot."
        );
        return;
      }

      alert(
        `Parking slot ${data.slotNumber} added successfully.`
      );

      setNewSlotNumber("");
      setNewSlotLocation("");

      await loadParkingSlots(
        token
      );
    } catch (error) {
      console.error(
        "Add slot error:",
        error
      );

      if (
        error.message !==
        "Session expired"
      ) {
        setError(
          "Unable to add parking slot."
        );
      }
    }
  };

  // ===================================================
  // ADMIN - CREATE BILL
  // ===================================================

  const handleCreateBill = async (
    e
  ) => {
    e.preventDefault();

    if (!billBookingId) {
      setError(
        "Please select a booking."
      );
      return;
    }

    const selectedBooking =
      bookings.find(
        (booking) =>
          booking.id ===
          Number(billBookingId)
      );

    if (!selectedBooking) {
      setError(
        "Booking not found."
      );
      return;
    }

    if (
      Number(billAmount) <= 0
    ) {
      setError(
        "Amount must be greater than 0."
      );
      return;
    }

    setError("");

    try {
      const response =
        await apiRequest(
          "/billing",
          {
            method: "POST",
            body: JSON.stringify({
              bookingId:
                Number(
                  billBookingId
                ),
              username:
                selectedBooking.username,
              amount:
                Number(
                  billAmount
                ),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to create bill."
        );
        return;
      }

      alert(
        "Bill created successfully!\n\n" +
        `Bill ID: ${data.id}\n` +
        `Booking ID: ${data.bookingId}\n` +
        `Username: ${data.username}\n` +
        `Amount: ₹${data.amount}\n` +
        `Payment: ${data.paymentStatus}`
      );

      setBillBookingId("");

      await loadAdminData(
        token
      );
    } catch (error) {
      console.error(
        "Billing error:",
        error
      );

      if (
        error.message !==
        "Session expired"
      ) {
        setError(
          "Unable to create bill."
        );
      }
    }
  };

  // ===================================================
  // USER - LOAD MY BILLS
  // ===================================================

  const loadMyBills = async () => {
    setError("");

    try {
      const response =
        await apiRequest(
          "/billing/my",
          {
            method: "GET",
          }
        );

      if (!response.ok) {
        const data =
          await response.json()
            .catch(() => null);

        throw new Error(
          data?.message ||
            `Billing API returned ${response.status}`
        );
      }

      const data =
        await response.json();

      setMyBills(data);
    } catch (error) {
      console.error(
        "My bills error:",
        error
      );

      if (
        error.message !==
        "Session expired"
      ) {
        setError(
          error.message ||
            "Unable to load your bills."
        );
      }
    }
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "username"
    );

    localStorage.removeItem(
      "role"
    );

    setToken(null);
    setRole("USER");
    setUsername("");

    setSlots([]);
    setBookings([]);
    setBills([]);
    setMyBills([]);

    setLatestBooking(null);

    setLoginUsername("");
    setLoginPassword("");

    setActiveTab("parking");
    setError("");
  };

  // ===================================================
  // LOGIN / REGISTER PAGE
  // ===================================================

  if (!token) {
    return (
      <div className="auth-page">

        <div className="auth-card">

          <div className="logo">
            P
          </div>

          <h1>
            ParkGrid
          </h1>

          <p className="subtitle">
            Smart Urban Parking System
          </p>

          {!registerMode ? (
            <>
              <div className="auth-heading">
                <h2>
                  Welcome Back
                </h2>

                <p>
                  Login to manage your parking
                </p>
              </div>

              <form
                onSubmit={handleLogin}
              >
                <label>
                  Username
                </label>

                <input
                  type="text"
                  placeholder="Enter username"
                  value={
                    loginUsername
                  }
                  onChange={(e) =>
                    setLoginUsername(
                      e.target.value
                    )
                  }
                  required
                />

                <label>
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Enter password"
                  value={
                    loginPassword
                  }
                  onChange={(e) =>
                    setLoginPassword(
                      e.target.value
                    )
                  }
                  required
                />

                <button
                  className="primary-btn"
                  type="submit"
                >
                  Login
                </button>
              </form>

              {error && (
                <div className="error-box">
                  {error}
                </div>
              )}

              <p className="auth-switch">
                New user?

                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setRegisterMode(
                      true
                    );
                    setError("");
                  }}
                >
                  Register here
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="auth-heading">
                <h2>
                  Create Account
                </h2>

                <p>
                  Register as a parking user
                </p>
              </div>

              <form
                onSubmit={
                  handleRegister
                }
              >
                <label>
                  Username
                </label>

                <input
                  type="text"
                  placeholder="Choose username"
                  value={
                    registerUsername
                  }
                  onChange={(e) =>
                    setRegisterUsername(
                      e.target.value
                    )
                  }
                  required
                />

                <label>
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Choose password"
                  value={
                    registerPassword
                  }
                  onChange={(e) =>
                    setRegisterPassword(
                      e.target.value
                    )
                  }
                  required
                />

                <button
                  className="primary-btn"
                  type="submit"
                >
                  Register
                </button>
              </form>

              {error && (
                <div className="error-box">
                  {error}
                </div>
              )}

              <p className="auth-switch">
                Already have an account?

                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setRegisterMode(
                      false
                    );
                    setError("");
                  }}
                >
                  Login
                </button>
              </p>
            </>
          )}

          <div className="auth-footer">
            <span>
              JWT Authentication
            </span>

            <span>•</span>

            <span>
              Microservices
            </span>
          </div>

        </div>
      </div>
    );
  }

  // ===================================================
  // DASHBOARD DATA
  // ===================================================

  const availableSlots =
    slots.filter(
      (slot) => slot.available
    ).length;

  const occupiedSlots =
    slots.filter(
      (slot) => !slot.available
    ).length;

  // ===================================================
  // DASHBOARD
  // ===================================================

  return (
    <div className="app-layout">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            P
          </div>

          <div>
            <h1>
              ParkGrid
            </h1>

            <p>
              Smart Parking
            </p>
          </div>

        </div>

        <div className="user-card">

          <div className="user-avatar">
            {username
              ? username
                  .charAt(0)
                  .toUpperCase()
              : "U"}
          </div>

          <div>
            <strong>
              {username}
            </strong>

            <span
              className={
                role === "ADMIN"
                  ? "admin-badge"
                  : "user-badge"
              }
            >
              {role}
            </span>
          </div>

        </div>

        <nav className="nav-menu">

          <button
            className={
              activeTab === "parking"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setActiveTab(
                "parking"
              );

              loadParkingSlots(
                token
              );
            }}
          >
            <span>
              🅿️
            </span>

            Parking
          </button>

          <button
            className={
              activeTab === "bookings"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setActiveTab(
                "bookings"
              );

              if (
                role === "ADMIN"
              ) {
                loadAdminData(
                  token
                );
              }
            }}
          >
            <span>
              📅
            </span>

            Bookings
          </button>

          <button
            className={
              activeTab === "billing"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setActiveTab(
                "billing"
              );

              if (
                role === "ADMIN"
              ) {
                loadAdminData(
                  token
                );
              } else {
                loadMyBills();
              }
            }}
          >
            <span>
              💳
            </span>

            Billing
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="architecture-mini">

            <strong>
              System
            </strong>

            <span>
              API Gateway : 8080
            </span>

            <span>
              Eureka : 8761
            </span>

            <span>
              PostgreSQL
            </span>

          </div>

          <button
            className="logout-sidebar"
            onClick={
              handleLogout
            }
          >
            🚪 Logout
          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main-content">

        <header className="top-header">

          <div>
            <h2>
              {activeTab ===
                "parking" &&
                "Parking Dashboard"}

              {activeTab ===
                "bookings" &&
                "Booking Management"}

              {activeTab ===
                "billing" &&
                "Billing Management"}
            </h2>

            <p>
              Manage your smart parking system
            </p>
          </div>

          <div className="header-status">
            <span className="online-dot"></span>
            System Online
          </div>

        </header>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* =================================================
            PARKING
            ================================================= */}

        {activeTab ===
          "parking" && (
          <section>

            <div className="summary">

              <div className="summary-card">

                <div className="summary-icon">
                  🅿️
                </div>

                <div>
                  <span>
                    Total Slots
                  </span>

                  <strong>
                    {slots.length}
                  </strong>
                </div>

              </div>

              <div className="summary-card available-summary">

                <div className="summary-icon">
                  ✅
                </div>

                <div>
                  <span>
                    Available
                  </span>

                  <strong>
                    {availableSlots}
                  </strong>
                </div>

              </div>

              <div className="summary-card occupied-summary">

                <div className="summary-icon">
                  🚗
                </div>

                <div>
                  <span>
                    Occupied
                  </span>

                  <strong>
                    {occupiedSlots}
                  </strong>
                </div>

              </div>

            </div>

            {/* ADMIN ADD SLOT */}

            {role === "ADMIN" && (
              <div className="panel">

                <div className="panel-title">

                  <div>
                    <h3>
                      Add Parking Slot
                    </h3>

                    <p>
                      Create a new available parking slot
                    </p>
                  </div>

                </div>

                <form
                  className="inline-form"
                  onSubmit={
                    handleAddSlot
                  }
                >

                  <input
                    type="text"
                    placeholder="Slot number e.g. D1"
                    value={
                      newSlotNumber
                    }
                    onChange={(e) =>
                      setNewSlotNumber(
                        e.target.value
                      )
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="Location e.g. Third Floor"
                    value={
                      newSlotLocation
                    }
                    onChange={(e) =>
                      setNewSlotLocation(
                        e.target.value
                      )
                    }
                    required
                  />

                  <button
                    className="primary-btn compact-btn"
                    type="submit"
                  >
                    + Add Slot
                  </button>

                </form>

              </div>
            )}

            <div className="section-header">

              <div>
                <h3>
                  Parking Slots
                </h3>

                <p>
                  View current slot availability
                </p>
              </div>

              <button
                className="secondary-btn"
                onClick={() =>
                  loadParkingSlots(
                    token
                  )
                }
              >
                ↻ Refresh
              </button>

            </div>

            {loading && (
              <div className="loading">
                Loading parking slots...
              </div>
            )}

            <div className="slot-grid">

              {slots.map(
                (slot) => (
                  <div
                    className={
                      slot.available
                        ? "slot-card available"
                        : "slot-card occupied"
                    }
                    key={slot.id}
                  >

                    <div className="slot-top">

                      <div className="slot-number">
                        {
                          slot.slotNumber
                        }
                      </div>

                      <span
                        className={
                          slot.available
                            ? "status status-available"
                            : "status status-occupied"
                        }
                      >
                        {slot.available
                          ? "AVAILABLE"
                          : "OCCUPIED"}
                      </span>

                    </div>

                    <div className="slot-location">
                      📍{" "}
                      {
                        slot.location
                      }
                    </div>

                    {slot.available ? (
                      <button
                        className="book-btn"
                        onClick={() =>
                          handleBooking(
                            slot.id
                          )
                        }
                        disabled={
                          bookingSlot ===
                          slot.id
                        }
                      >
                        {bookingSlot ===
                        slot.id
                          ? "Booking..."
                          : "Book Slot"}
                      </button>
                    ) : (
                      <div className="occupied-text">
                        Currently unavailable
                      </div>
                    )}

                  </div>
                )
              )}

            </div>

            {!loading &&
              slots.length === 0 && (
                <div className="empty-state">
                  No parking slots found.
                </div>
              )}

          </section>
        )}

        {/* =================================================
            BOOKINGS
            ================================================= */}

        {activeTab ===
          "bookings" && (
          <section>

            {role === "USER" && (
              <>
                {latestBooking ? (
                  <div className="success-card">

                    <div className="success-icon">
                      ✓
                    </div>

                    <div>

                      <h3>
                        Booking Successful
                      </h3>

                      <p>
                        Booking ID:
                        <strong>
                          {" "}
                          {
                            latestBooking.id
                          }
                        </strong>
                      </p>

                      <p>
                        Parking Slot:
                        <strong>
                          {" "}
                          {
                            latestBooking.parkingSlotId
                          }
                        </strong>
                      </p>

                      <p>
                        Date:
                        <strong>
                          {" "}
                          {
                            latestBooking.bookingDate
                          }
                        </strong>
                      </p>

                      <p>
                        Status:
                        <strong>
                          {" "}
                          {
                            latestBooking.status
                          }
                        </strong>
                      </p>

                    </div>

                  </div>
                ) : (
                  <div className="empty-panel">

                    <div className="large-icon">
                      📅
                    </div>

                    <h3>
                      No booking in this session
                    </h3>

                    <p>
                      Go to Parking and book an available slot.
                    </p>

                    <button
                      className="primary-btn small-btn"
                      onClick={() =>
                        setActiveTab(
                          "parking"
                        )
                      }
                    >
                      View Parking
                    </button>

                  </div>
                )}
              </>
            )}

            {role === "ADMIN" && (
              <div className="panel">

                <div className="section-header">

                  <div>
                    <h3>
                      All Bookings
                    </h3>

                    <p>
                      Booking Service records
                    </p>
                  </div>

                  <button
                    className="secondary-btn"
                    onClick={() =>
                      loadAdminData(
                        token
                      )
                    }
                  >
                    ↻ Refresh
                  </button>

                </div>

                <div className="table-wrapper">

                  <table>

                    <thead>
                      <tr>
                        <th>
                          ID
                        </th>

                        <th>
                          Username
                        </th>

                        <th>
                          Slot
                        </th>

                        <th>
                          Date
                        </th>

                        <th>
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {bookings.map(
                        (booking) => (
                          <tr
                            key={
                              booking.id
                            }
                          >

                            <td>
                              #{booking.id}
                            </td>

                            <td>
                              {
                                booking.username
                              }
                            </td>

                            <td>
                              Slot{" "}
                              {
                                booking.parkingSlotId
                              }
                            </td>

                            <td>
                              {
                                booking.bookingDate
                              }
                            </td>

                            <td>
                              <span className="table-status">
                                {
                                  booking.status
                                }
                              </span>
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                  {bookings.length === 0 && (
                    <div className="empty-state">
                      No bookings found.
                    </div>
                  )}

                </div>

              </div>
            )}

          </section>
        )}

        {/* =================================================
            BILLING
            ================================================= */}

        {activeTab ===
          "billing" && (
          <section>

            {/* ADMIN */}

            {role === "ADMIN" && (
              <>
                {/* CREATE BILL */}

                <div className="panel">

                  <div className="panel-title">

                    <div>
                      <h3>
                        Create Bill
                      </h3>

                      <p>
                        Billing Service
                      </p>
                    </div>

                  </div>

                  <form
                    className="billing-form"
                    onSubmit={
                      handleCreateBill
                    }
                  >

                    <div>

                      <label>
                        Booking
                      </label>

                      <select
                        value={
                          billBookingId
                        }
                        onChange={(e) =>
                          setBillBookingId(
                            e.target.value
                          )
                        }
                        required
                      >

                        <option value="">
                          Select booking
                        </option>

                        {bookings.map(
                          (booking) => (
                            <option
                              key={
                                booking.id
                              }
                              value={
                                booking.id
                              }
                            >
                              Booking #
                              {
                                booking.id
                              }
                              {" - "}
                              {
                                booking.username
                              }
                              {" - Slot "}
                              {
                                booking.parkingSlotId
                              }
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    <div>

                      <label>
                        Amount
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={
                          billAmount
                        }
                        onChange={(e) =>
                          setBillAmount(
                            e.target.value
                          )
                        }
                        required
                      />

                    </div>

                    <button
                      className="primary-btn"
                      type="submit"
                    >
                      Create Bill
                    </button>

                  </form>

                </div>

                {/* ALL BILLS */}

                <div className="panel">

                  <div className="section-header">

                    <div>
                      <h3>
                        All Bills
                      </h3>

                      <p>
                        Billing Service records
                      </p>
                    </div>

                    <button
                      className="secondary-btn"
                      onClick={() =>
                        loadAdminData(
                          token
                        )
                      }
                    >
                      ↻ Refresh
                    </button>

                  </div>

                  <div className="table-wrapper">

                    <table>

                      <thead>
                        <tr>
                          <th>
                            Bill ID
                          </th>

                          <th>
                            Booking
                          </th>

                          <th>
                            Username
                          </th>

                          <th>
                            Amount
                          </th>

                          <th>
                            Payment
                          </th>
                        </tr>
                      </thead>

                      <tbody>

                        {bills.map(
                          (bill) => (
                            <tr
                              key={
                                bill.id
                              }
                            >

                              <td>
                                #{
                                  bill.id
                                }
                              </td>

                              <td>
                                #{
                                  bill.bookingId
                                }
                              </td>

                              <td>
                                {
                                  bill.username
                                }
                              </td>

                              <td>
                                ₹
                                {
                                  bill.amount
                                }
                              </td>

                              <td>
                                <span className="pending-status">
                                  {
                                    bill.paymentStatus
                                  }
                                </span>
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                    {bills.length === 0 && (
                      <div className="empty-state">
                        No bills found.
                      </div>
                    )}

                  </div>

                </div>
              </>
            )}

            {/* USER */}

            {role === "USER" && (
              <div className="panel">

                <div className="section-header">

                  <div>
                    <h3>
                      My Bills
                    </h3>

                    <p>
                      Billing details for your bookings
                    </p>
                  </div>

                  <button
                    className="secondary-btn"
                    onClick={
                      loadMyBills
                    }
                  >
                    ↻ Refresh
                  </button>

                </div>

                {myBills.length === 0 ? (
                  <div className="empty-panel">

                    <div className="large-icon">
                      💳
                    </div>

                    <h3>
                      No bills available
                    </h3>

                    <p>
                      Your billing information will appear here after a bill is created.
                    </p>

                    <button
                      className="primary-btn small-btn"
                      onClick={() =>
                        loadMyBills()
                      }
                    >
                      Check Again
                    </button>

                  </div>
                ) : (
                  <div className="my-bills-grid">

                    {myBills.map(
                      (bill) => (
                        <div
                          className="bill-card"
                          key={bill.id}
                        >

                          <div className="bill-header">

                            <div>
                              <span>
                                Bill ID
                              </span>

                              <h3>
                                #{bill.id}
                              </h3>
                            </div>

                            <div className="bill-amount">
                              ₹
                              {
                                bill.amount
                              }
                            </div>

                          </div>

                          <div className="bill-details">

                            <div>
                              <span>
                                Booking ID
                              </span>

                              <strong>
                                #
                                {
                                  bill.bookingId
                                }
                              </strong>
                            </div>

                            <div>
                              <span>
                                Username
                              </span>

                              <strong>
                                {
                                  bill.username
                                }
                              </strong>
                            </div>

                            <div>
                              <span>
                                Payment Status
                              </span>

                              <strong className="pending-text">
                                {
                                  bill.paymentStatus
                                }
                              </strong>
                            </div>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>
            )}

          </section>
        )}

      </main>
    </div>
  );
}

export default App;