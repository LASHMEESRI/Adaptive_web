import React, { useState, useEffect } from "react";
import { Power, Wifi, WifiOff } from "lucide-react";

export default function FirebaseStatusControl() {
  const [status, setStatus] = useState(0);
  const [objectDetection, setObjectDetection] = useState(0);
  const [detection, setDetection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBgXvvGWdb5Xug2tVdN-0X8RtbjDytmXoA",
    authDomain: "object-90903.firebaseapp.com",
    databaseURL: "https://object-90903-default-rtdb.firebaseio.com",
    projectId: "object-90903",
    storageBucket: "object-90903.firebasestorage.app",
    messagingSenderId: "433114058350",
    appId: "1:433114058350:web:1cc393293c5664e08aa07f",
    measurementId: "G-QF6WELQLZV",
  };

  // Initialize Firebase and listen to status changes
  useEffect(() => {
    // Check if Firebase is already initialized
    if (typeof window.firebase === "undefined") {
      console.log("Firebase SDK not loaded. Loading from CDN...");
      loadFirebaseSDK();
      return;
    }

    initializeFirebase();
  }, []);

  const loadFirebaseSDK = () => {
    // Load Firebase scripts
    const scripts = [
      "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js",
      "https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js",
    ];

    let loadedCount = 0;
    scripts.forEach((src) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        loadedCount++;
        if (loadedCount === scripts.length) {
          initializeFirebase();
        }
      };
      script.onerror = () => {
        console.error("Failed to load Firebase SDK");
      };
      document.body.appendChild(script);
    });
  };

  const initializeFirebase = () => {
    try {
      // Initialize Firebase
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }

      const database = window.firebase.database();
      const statusRef = database.ref("device/status");
      const objectDetectionRef = database.ref("device/object_detected");
      const detectionRef = database.ref("device/detection");

      // Listen for status changes
      statusRef.on(
        "value",
        (snapshot) => {
          const value = snapshot.val();
          if (value !== null) {
            setStatus(value);
          }
          setConnected(true);
        },
        (err) => {
          console.error("Failed to read from database:", err.message);
          setConnected(false);
        }
      );

      // Listen for object detection changes
      objectDetectionRef.on(
        "value",
        (snapshot) => {
          const value = snapshot.val();
          if (value !== null) {
            setObjectDetection(value);
          }
        },
        (err) => {
          console.error("Failed to read object detection:", err.message);
        }
      );

      // Listen for detection changes
      detectionRef.on(
        "value",
        (snapshot) => {
          const value = snapshot.val();
          if (value !== null) {
            setDetection(value);

            // If detection is 1, reset it to 0 after 10 seconds
            if (value === 1) {
              setTimeout(async () => {
                try {
                  await detectionRef.set(0);
                } catch (err) {
                  console.error("Failed to reset detection:", err.message);
                }
              }, 5000);
            }
          }
        },
        (err) => {
          console.error("Failed to read detection:", err.message);
        }
      );

      // Connection state
      const connectedRef = database.ref(".info/connected");
      connectedRef.on("value", (snapshot) => {
        setConnected(snapshot.val() === true);
      });
    } catch (err) {
      console.error("Firebase initialization error:", err.message);
      setConnected(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setLoading(true);

    try {
      if (typeof window.firebase === "undefined") {
        throw new Error("Firebase not initialized");
      }

      const database = window.firebase.database();
      const statusRef = database.ref("device/status");
      const objectDetectionRef = database.ref("device/object_detected");
      const detectionRef = database.ref("device/detection");

      await statusRef.set(newStatus);

      // If turning OFF, reset everything to 0
      if (newStatus === 0) {
        await objectDetectionRef.set(0);
        await detectionRef.set(0);
        setObjectDetection(0);
        setDetection(0);
      }

      // Update local state
      setStatus(newStatus);
    } catch (err) {
      console.error("Failed to update status:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-indigo-100 rounded-full mb-3 sm:mb-4">
            <Power className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Device Control
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Firebase Realtime Status
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-gray-50 rounded-lg">
          {connected ? (
            <>
              <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              <span className="text-xs sm:text-sm font-medium text-green-600">
                Connected
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              <span className="text-xs sm:text-sm font-medium text-red-600">
                Disconnected
              </span>
            </>
          )}
        </div>

        {/* Device Status Display */}
        <div className="mb-6 sm:mb-8 text-center">
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-3">
            Device Status
          </p>
          <div
            className={`inline-flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full transition-all duration-300 ${
              status === 1
                ? "bg-green-100 shadow-lg shadow-green-200"
                : "bg-gray-100 shadow-inner"
            }`}
          >
            <div
              className={`text-4xl sm:text-5xl font-bold ${
                status === 1 ? "text-green-600" : "text-gray-400"
              }`}
            >
              {status === 1 ? "ON" : "OFF"}
            </div>
          </div>
        </div>

        {/* Object Detection Status - Only shown when device is ON */}
        {status === 1 && (
          <div className="mb-6 sm:mb-8">
            <div
              className={`p-4 rounded-xl transition-all duration-300 ${
                objectDetection === 0 && detection === 1
                  ? "bg-green-50 border-2 border-green-300"
                  : objectDetection === 1
                  ? "bg-blue-50 border-2 border-blue-300"
                  : "bg-gray-50 border-2 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base font-medium text-gray-700">
                  Object Detection
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                    objectDetection === 0 && detection === 1
                      ? "bg-green-200 text-green-800"
                      : objectDetection === 1
                      ? "bg-blue-200 text-blue-800"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {objectDetection === 0 && detection === 1
                    ? "Object Detected Successfully"
                    : objectDetection === 1
                    ? "Object Detected Analysing..."
                    : "No Object Detected"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => updateStatus(1)}
            disabled={loading || !connected}
            className={`py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base text-white transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              status === 1
                ? "bg-green-600 shadow-lg shadow-green-200"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {loading && status !== 1 ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              "Turn ON"
            )}
          </button>

          <button
            onClick={() => updateStatus(0)}
            disabled={loading || !connected}
            className={`py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base text-white transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              status === 0
                ? "bg-gray-600 shadow-lg shadow-gray-200"
                : "bg-gray-500 hover:bg-gray-600"
            }`}
          >
            {loading && status !== 0 ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              "Turn OFF"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
