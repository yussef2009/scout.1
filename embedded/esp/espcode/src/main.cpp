/**
 * SCOT Motion Sensor — ESP32 + MPU6050 Firmware
 * 
 * Hardware:
 *   - ESP32 Development Board (ESP-WROOM-32 / DevKit v1)
 *   - GY-521 MPU-6050 6-Axis Motion Tracking Sensor (I2C)
 * 
 * I2C Connections:
 *   - ESP32 3V3   <--> MPU6050 VCC
 *   - ESP32 GND   <--> MPU6050 GND
 *   - ESP32 GPIO21<--> MPU6050 SDA
 *   - ESP32 GPIO22<--> MPU6050 SCL
 * 
 * Networking:
 *   - Operates in Wi-Fi SoftAP Mode: SSID "SCOT-Sensor"
 *   - Default Gateway IP: 192.168.4.1
 *   - REST Endpoint: GET http://192.168.4.1/data
 *   - Built-in CORS headers (Access-Control-Allow-Origin: *)
 */

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>

// Wi-Fi Access Point Configuration
const char* AP_SSID = "SCOT-Sensor";
const char* AP_PASS = ""; // Open network for easy pairing; set password if desired

// I2C Pins for ESP32
#define I2C_SDA 21
#define I2C_SCL 22

Adafruit_MPU6050 mpu;
WebServer server(80);
bool mpuInitialized = false;

// Helper to append CORS headers to all responses
void applyCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS, POST");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  server.sendHeader("Access-Control-Max-Age", "86400");
}

// Handle HTTP OPTIONS preflight requests
void handleOptions() {
  applyCorsHeaders();
  server.send(204);
}

// Root landing page to verify sensor and connectivity from any browser
void handleRoot() {
  applyCorsHeaders();
  String html = "<!DOCTYPE html><html><head><title>SCOT Motion Sensor</title>";
  html += "<style>body{font-family:sans-serif;background:#0a0a0c;color:#fff;padding:40px;line-height:1.6;}";
  html += "h1{color:#ffd700;}code{background:#1a1a20;padding:4px 8px;border-radius:4px;color:#22c55e;}</style></head><body>";
  html += "<h1>SCOT Wearable Sensor — ESP32 + MPU6050</h1>";
  html += "<p>Hardware Status: <strong>" + String(mpuInitialized ? "MPU6050 ACTIVE (OK)" : "MPU6050 NOT DETECTED (CHECK I2C WIRING)") + "</strong></p>";
  html += "<p>Wi-Fi Access Point: <code>" + String(AP_SSID) + "</code></p>";
  html += "<p>Active Data Endpoint: <a href='/data' style='color:#ffd700;'>/data</a></p>";
  html += "<p>Open your SCOT dashboard in the browser and navigate to the <strong>Wearable</strong> page to view real-time kinematics.</p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

// REST Endpoint: Returns real-time 6-axis kinematics in SI units
void handleData() {
  applyCorsHeaders();

  StaticJsonDocument<384> doc;

  if (mpuInitialized) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    // Accelerometer in SI units (m/s^2)
    JsonObject accel = doc.createNestedObject("accel");
    accel["x"] = round(a.acceleration.x * 100.0) / 100.0;
    accel["y"] = round(a.acceleration.y * 100.0) / 100.0;
    accel["z"] = round(a.acceleration.z * 100.0) / 100.0;

    // Gyroscope in SI units (rad/s)
    JsonObject gyro = doc.createNestedObject("gyro");
    gyro["x"] = round(g.gyro.x * 1000.0) / 1000.0;
    gyro["y"] = round(g.gyro.y * 1000.0) / 1000.0;
    gyro["z"] = round(g.gyro.z * 1000.0) / 1000.0;

    doc["temp_c"] = round(temp.temperature * 10.0) / 10.0;
  } else {
    // Fallback if sensor fails to respond over I2C
    JsonObject accel = doc.createNestedObject("accel");
    accel["x"] = nullptr;
    accel["y"] = nullptr;
    accel["z"] = nullptr;

    JsonObject gyro = doc.createNestedObject("gyro");
    gyro["x"] = nullptr;
    gyro["y"] = nullptr;
    gyro["z"] = nullptr;

    doc["error"] = "MPU6050 not initialized or I2C communication failure";
  }

  doc["timestamp_ms"] = millis();

  JsonObject units = doc.createNestedObject("units");
  units["accel"] = "m/s²";
  units["gyro"] = "rad/s";

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[SCOT] Initializing Motion Sensor Firmware...");

  // Initialize I2C Bus on GPIO 21 (SDA) and GPIO 22 (SCL)
  Wire.begin(I2C_SDA, I2C_SCL);

  // Initialize MPU6050
  if (!mpu.begin(0x68, &Wire)) {
    // Try alternate I2C address 0x69 if AD0 is pulled HIGH
    if (!mpu.begin(0x69, &Wire)) {
      Serial.println("[SCOT Error] Failed to find MPU6050 chip. Check wiring (VCC, GND, SDA, SCL).");
      mpuInitialized = false;
    } else {
      mpuInitialized = true;
    }
  } else {
    mpuInitialized = true;
  }

  if (mpuInitialized) {
    Serial.println("[SCOT] MPU6050 detected and initialized successfully.");
    // Configure dynamic ranges suited for athletic movement and impact tracking
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);   // +-8G for sports acceleration
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);         // +-500 deg/s for athlete rotations
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);      // Low-pass filter to dampen mechanical vibration
  }

  // Setup Wi-Fi SoftAP Mode
  WiFi.mode(WIFI_AP);
  bool apSuccess = WiFi.softAP(AP_SSID, AP_PASS);

  if (apSuccess) {
    IPAddress IP = WiFi.softAPIP();
    Serial.print("[SCOT] Access Point started: ");
    Serial.println(AP_SSID);
    Serial.print("[SCOT] Sensor IP Address: ");
    Serial.println(IP);
    Serial.println("[SCOT] Data Endpoint: http://192.168.4.1/data");
  } else {
    Serial.println("[SCOT Error] Failed to start Wi-Fi Access Point.");
  }

  // Register WebServer routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/data", HTTP_GET, handleData);
  server.on("/data", HTTP_OPTIONS, handleOptions);
  server.onNotFound(handleOptions); // Handle any preflight OPTIONS requests gracefully

  server.begin();
  Serial.println("[SCOT] Web server listening on port 80 with CORS enabled.");
}

void loop() {
  server.handleClient();
  delay(2); // Yield CPU to Wi-Fi stack
}
