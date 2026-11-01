/**
 * SCOT Motion Sensor Firmware (ESP32 + MPU6500 / MPU6050)
 * 
 * Hardware Wiring:
 *   - ESP32 3V3   <--> Sensor VCC
 *   - ESP32 GND   <--> Sensor GND
 *   - ESP32 GPIO19<--> Sensor SDA
 *   - ESP32 GPIO18<--> Sensor SCL
 * 
 * Connectivity & Protocol:
 *   - Wi-Fi SoftAP: "SCOT-Sensor" (IP: 192.168.4.1, Port 80)
 *   - Optional Station Mode: Connects to local Wi-Fi if credentials configured
 *   - REST Endpoint: GET /data (JSON format compatible with SCOT software)
 *   - CORS Support: Access-Control-Allow-Origin: * on all endpoints
 *   - USB Serial: Emits JSON lines at 115200 baud for direct WebSerial in browser
 */

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>

// ==========================================
// Hardware Pinout & Configuration
// ==========================================
#define I2C_SDA 19
#define I2C_SCL 18
#define I2C_FREQ 400000 // 400kHz Fast Mode

#define MPU_ADDR_PRIMARY   0x68
#define MPU_ADDR_SECONDARY 0x69

// MPU6500 / MPU6050 Registers
#define REG_SMPLRT_DIV   0x19
#define REG_CONFIG       0x1A
#define REG_GYRO_CONFIG  0x1B
#define REG_ACCEL_CONFIG 0x1C
#define REG_ACCEL_XOUT_H 0x3B
#define REG_PWR_MGMT_1   0x6B
#define REG_WHO_AM_I     0x75

// ==========================================
// Network Configuration
// ==========================================
// Wi-Fi Access Point (Always active)
const char* AP_SSID = "SCOT-Sensor";
const char* AP_PASS = ""; // Open network for zero-friction athletic pairing

// Optional Wi-Fi Station (Uncomment and fill in to join home/office router)
const char* STA_SSID = ""; 
const char* STA_PASS = "";

// ==========================================
// Global Variables & Sensor State
// ==========================================
WebServer server(80);

uint8_t activeMpuAddr = MPU_ADDR_PRIMARY;
bool sensorDetected = false;
String sensorChipName = "Unknown";
uint8_t sensorChipId = 0x00;

float currentAx = 0.0f;
float currentAy = 0.0f;
float currentAz = 9.81f;
float currentGx = 0.0f;
float currentGy = 0.0f;
float currentGz = 0.0f;
float currentTemp = 25.0f;
unsigned long lastSampleTime = 0;
unsigned long lastSerialStreamTime = 0;
const unsigned long SERIAL_STREAM_INTERVAL_MS = 100; // 10Hz serial stream for WebSerial

// ==========================================
// Low-Level I2C Helpers
// ==========================================
bool writeRegister(uint8_t addr, uint8_t reg, uint8_t value) {
    Wire.beginTransmission(addr);
    Wire.write(reg);
    Wire.write(value);
    return Wire.endTransmission() == 0;
}

uint8_t readRegister(uint8_t addr, uint8_t reg) {
    Wire.beginTransmission(addr);
    Wire.write(reg);
    if (Wire.endTransmission(false) != 0) return 0xFF;

    Wire.requestFrom(addr, (uint8_t)1);
    if (!Wire.available()) return 0xFF;
    return Wire.read();
}

bool initMpuSensor() {
    // Try primary address 0x68 first, then secondary 0x69
    uint8_t addrs[2] = {MPU_ADDR_PRIMARY, MPU_ADDR_SECONDARY};
    
    for (int i = 0; i < 2; i++) {
        uint8_t addr = addrs[i];
        uint8_t id = readRegister(addr, REG_WHO_AM_I);
        
        if (id != 0xFF && id != 0x00) {
            activeMpuAddr = addr;
            sensorChipId = id;
            
            if (id == 0x70) sensorChipName = "MPU6500";
            else if (id == 0x68) sensorChipName = "MPU6050";
            else if (id == 0x71) sensorChipName = "MPU9250";
            else if (id == 0x73) sensorChipName = "MPU9255";
            else if (id == 0x19) sensorChipName = "MPU6886";
            else sensorChipName = "InvenSense IMU (0x" + String(id, HEX) + ")";

            // Wake up device: clear SLEEP bit and set clock source to Auto-select best available (PLL)
            writeRegister(addr, REG_PWR_MGMT_1, 0x01);
            delay(20);

            // Set sample rate divider (1kHz / (1 + 4) = 200Hz)
            writeRegister(addr, REG_SMPLRT_DIV, 0x04);

            // DLPF Config: Bandwidth ~42Hz, delay ~4.8ms
            writeRegister(addr, REG_CONFIG, 0x03);

            // Gyro Config: +/- 500 deg/s (65.5 LSB/(deg/s))
            writeRegister(addr, REG_GYRO_CONFIG, 0x08);

            // Accel Config: +/- 8g (4096 LSB/g)
            writeRegister(addr, REG_ACCEL_CONFIG, 0x10);

            return true;
        }
    }
    return false;
}

bool readSensorKinematics() {
    if (!sensorDetected) return false;

    Wire.beginTransmission(activeMpuAddr);
    Wire.write(REG_ACCEL_XOUT_H);
    if (Wire.endTransmission(false) != 0) return false;

    // Read 14 consecutive bytes:
    // Accel X [H,L], Accel Y [H,L], Accel Z [H,L]
    // Temp [H,L]
    // Gyro X [H,L], Gyro Y [H,L], Gyro Z [H,L]
    uint8_t count = Wire.requestFrom((uint8_t)activeMpuAddr, (uint8_t)14);
    if (count < 14) return false;

    int16_t rawAx = (Wire.read() << 8) | Wire.read();
    int16_t rawAy = (Wire.read() << 8) | Wire.read();
    int16_t rawAz = (Wire.read() << 8) | Wire.read();
    int16_t rawTemp = (Wire.read() << 8) | Wire.read();
    int16_t rawGx = (Wire.read() << 8) | Wire.read();
    int16_t rawGy = (Wire.read() << 8) | Wire.read();
    int16_t rawGz = (Wire.read() << 8) | Wire.read();

    // Scale to SI Units:
    // Accelerometer (+/- 8g, 4096 LSB/g): 1g = 9.80665 m/s²
    currentAx = (rawAx / 4096.0f) * 9.80665f;
    currentAy = (rawAy / 4096.0f) * 9.80665f;
    currentAz = (rawAz / 4096.0f) * 9.80665f;

    // Gyroscope (+/- 500 dps, 65.5 LSB/dps): convert to rad/s
    currentGx = (rawGx / 65.5f) * DEG_TO_RAD;
    currentGy = (rawGy / 65.5f) * DEG_TO_RAD;
    currentGz = (rawGz / 65.5f) * DEG_TO_RAD;

    // Temperature in °C (MPU6500: (tempRaw/333.87)+21.0 ; MPU6050: (tempRaw/340.0)+36.53)
    if (sensorChipId == 0x70) {
        currentTemp = (rawTemp / 333.87f) + 21.0f;
    } else {
        currentTemp = (rawTemp / 340.0f) + 36.53f;
    }

    return true;
}

// ==========================================
// JSON Payload Builder for SCOT Software
// ==========================================
String buildSensorJson() {
    char buf[320];
    if (sensorDetected) {
        snprintf(buf, sizeof(buf),
            "{\"accel\":{\"x\":%.2f,\"y\":%.2f,\"z\":%.2f},"
            "\"gyro\":{\"x\":%.3f,\"y\":%.3f,\"z\":%.3f},"
            "\"temp_c\":%.1f,"
            "\"timestamp_ms\":%lu,"
            "\"sensor\":\"%s\","
            "\"units\":{\"accel\":\"m/s\\u00b2\",\"gyro\":\"rad/s\"}}",
            currentAx, currentAy, currentAz,
            currentGx, currentGy, currentGz,
            currentTemp,
            (unsigned long)millis(),
            sensorChipName.c_str()
        );
    } else {
        snprintf(buf, sizeof(buf),
            "{\"accel\":{\"x\":null,\"y\":null,\"z\":null},"
            "\"gyro\":{\"x\":null,\"y\":null,\"z\":null},"
            "\"temp_c\":null,"
            "\"timestamp_ms\":%lu,"
            "\"error\":\"Sensor not detected on SDA 19 / SCL 18\","
            "\"units\":{\"accel\":\"m/s\\u00b2\",\"gyro\":\"rad/s\"}}",
            (unsigned long)millis()
        );
    }
    return String(buf);
}

// ==========================================
// WebServer HTTP Handlers & CORS
// ==========================================
void applyCorsHeaders() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
    server.sendHeader("Access-Control-Max-Age", "86400");
}

void handleOptions() {
    applyCorsHeaders();
    server.send(204, "text/plain", "");
}

void handleData() {
    applyCorsHeaders();
    readSensorKinematics();
    String json = buildSensorJson();
    server.send(200, "application/json", json);
}

void handleRoot() {
    applyCorsHeaders();
    String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>SCOT Motion Sensor</title>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
    html += "<style>";
    html += "body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#0d0e12;color:#e2e8f0;margin:0;padding:32px;}";
    html += ".card{max-width:640px;margin:0 auto;background:#161922;border:1px solid #2d3748;border-radius:12px;padding:24px;}";
    html += "h1{color:#eab308;margin-top:0;font-size:22px;}";
    html += ".badge{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:bold;margin-bottom:16px;}";
    html += ".badge-ok{background:#064e3b;color:#34d399;} .badge-err{background:#7f1d1d;color:#f87171;}";
    html += "table{width:100%;border-collapse:collapse;margin:16px 0;}";
    html += "td,th{padding:8px 12px;text-align:left;border-bottom:1px solid #242b38;}";
    html += "th{color:#94a3b8;font-size:12px;} td{font-family:monospace;font-size:14px;}";
    html += "a.btn{display:inline-block;background:#eab308;color:#000;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:12px;}";
    html += "code{background:#202533;padding:2px 6px;border-radius:4px;color:#38bdf8;}";
    html += "</style></head><body>";
    html += "<div class='card'>";
    html += "<h1>SCOT Wearable Sensor</h1>";

    if (sensorDetected) {
        html += "<div class='badge badge-ok'>ACTIVE &middot; " + sensorChipName + " (0x" + String(sensorChipId, HEX) + ")</div>";
    } else {
        html += "<div class='badge badge-err'>SENSOR NOT DETECTED (CHECK SDA 19 / SCL 18)</div>";
    }

    html += "<p>Hardware: <strong>ESP32 Dev Module</strong> &middot; I2C SDA: <code>GPIO 19</code> &middot; SCL: <code>GPIO 18</code></p>";
    html += "<p>Access Point: <code>" + String(AP_SSID) + "</code> &middot; IP: <code>192.168.4.1</code></p>";

    readSensorKinematics();
    html += "<table>";
    html += "<tr><th>AXIS</th><th>ACCELERATION (m/s&sup2;)</th><th>GYROSCOPE (rad/s)</th></tr>";
    html += "<tr><td>X</td><td>" + String(currentAx, 2) + "</td><td>" + String(currentGx, 3) + "</td></tr>";
    html += "<tr><td>Y</td><td>" + String(currentAy, 2) + "</td><td>" + String(currentGy, 3) + "</td></tr>";
    html += "<tr><td>Z</td><td>" + String(currentAz, 2) + "</td><td>" + String(currentGz, 3) + "</td></tr>";
    html += "</table>";

    html += "<p>Temperature: <strong>" + String(currentTemp, 1) + " &deg;C</strong></p>";
    html += "<a class='btn' href='/data'>View Live JSON (/data)</a>";
    html += "<p style='font-size:12px;color:#94a3b8;margin-top:20px;'>Connect your SCOT Web Dashboard to <code>http://192.168.4.1/data</code> or plug via USB using WebSerial.</p>";
    html += "</div></body></html>";

    server.send(200, "text/html", html);
}

// ==========================================
// Setup & Loop
// ==========================================
void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n==============================================");
    Serial.println("  SCOT WEARABLE SENSOR FIRMWARE (ESP32)");
    Serial.println("==============================================");

    // Initialize I2C on pins 19 (SDA) and 18 (SCL)
    Wire.begin(I2C_SDA, I2C_SCL, I2C_FREQ);
    delay(100);

    Serial.printf("[I2C] Initializing bus on SDA: %d, SCL: %d...\n", I2C_SDA, I2C_SCL);
    sensorDetected = initMpuSensor();

    if (sensorDetected) {
        Serial.printf("[SENSOR] SUCCESS: Detected %s (ID: 0x%02X) at I2C 0x%02X\n",
                      sensorChipName.c_str(), sensorChipId, activeMpuAddr);
    } else {
        Serial.println("[SENSOR ERROR] No MPU sensor found on SDA: 19, SCL: 18!");
        Serial.println("[SENSOR ERROR] Please check wiring: 3V3, GND, SDA->19, SCL->18.");
    }

    // Start Wi-Fi
    if (strlen(STA_SSID) > 0) {
        WiFi.mode(WIFI_AP_STA);
        WiFi.begin(STA_SSID, STA_PASS);
        Serial.printf("[WIFI] Connecting to Station: %s...\n", STA_SSID);
    } else {
        WiFi.mode(WIFI_AP);
    }

    bool apOk = WiFi.softAP(AP_SSID, AP_PASS);
    if (apOk) {
        IPAddress apIp = WiFi.softAPIP();
        Serial.printf("[WIFI AP] SSID: %s\n", AP_SSID);
        Serial.printf("[WIFI AP] Gateway IP: %s\n", apIp.toString().c_str());
        Serial.printf("[WIFI AP] Telemetry Endpoint: http://%s/data\n", apIp.toString().c_str());
    } else {
        Serial.println("[WIFI AP ERROR] Failed to initialize SoftAP!");
    }

    // HTTP Routes
    server.on("/", HTTP_GET, handleRoot);
    server.on("/data", HTTP_GET, handleData);
    server.on("/data", HTTP_OPTIONS, handleOptions);
    server.onNotFound([]() {
        if (server.method() == HTTP_OPTIONS) {
            handleOptions();
        } else {
            applyCorsHeaders();
            server.send(404, "text/plain", "Not Found");
        }
    });

    server.begin();
    Serial.println("[HTTP] REST Server listening on port 80 with CORS enabled.");
    Serial.println("[SERIAL] Streaming JSON telemetry enabled (115200 baud).");
    Serial.println("==============================================\n");
}

void loop() {
    // Handle incoming HTTP client requests
    server.handleClient();

    unsigned long now = millis();

    // Sample sensor and stream JSON over Serial every interval
    if (now - lastSerialStreamTime >= SERIAL_STREAM_INTERVAL_MS) {
        lastSerialStreamTime = now;
        readSensorKinematics();
        String json = buildSensorJson();
        Serial.println(json);
    }

    // Yield CPU time to Wi-Fi stack & RTOS scheduler
    delay(2);
}
