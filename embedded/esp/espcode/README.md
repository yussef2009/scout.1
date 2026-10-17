# SCOT ESP32 + MPU6050 Motion Sensor Firmware

Embedded firmware for real-time kinematic telemetry streaming to the SCOT sports performance web dashboard.

## 1. Hardware Required

- **Microcontroller**: ESP32 Development Board (ESP-WROOM-32 or compatible).
- **IMU Sensor**: GY-521 MPU-6050 6-Axis Motion Tracking Sensor (Accelerometer + Gyroscope).
- **Wiring**: 4 female-to-female jumper wires.
- **Power**: Micro-USB or 3.7V LiPo battery.

## 2. Wiring Diagram

| GY-521 Pin | ESP32 Pin | Function |
| :--- | :--- | :--- |
| **VCC** | **3V3** (or 5V if GY-521 has 3.3V LDO) | Power supply |
| **GND** | **GND** | System Ground |
| **SCL** | **GPIO 22** | I2C Clock Line |
| **SDA** | **GPIO 21** | I2C Data Line |
| **AD0** | Unconnected (or GND) | Sets I2C Address to `0x68` |
| **INT** | Unconnected | (Optional hardware interrupt) |

## 3. Building and Flashing via PlatformIO

### Prerequisites
- Install [VS Code](https://code.visualstudio.com/) and the **PlatformIO IDE** extension (or PlatformIO Core CLI).

### Build & Upload Commands
From this directory (`embedded/esp/espcode`):

```bash
# Compile firmware
pio run

# Flash to connected ESP32
pio run --target upload

# Open serial monitor at 115200 baud
pio run --target monitor
```

## 4. Connecting to the SCOT Dashboard

1. Power on the ESP32.
2. The ESP32 creates an open Wi-Fi network:
   - **SSID**: `SCOT-Sensor`
   - **Password**: *(none by default)*
   - **Sensor IP**: `192.168.4.1`
3. Connect your laptop Wi-Fi to `SCOT-Sensor`.
4. In your browser, test the endpoint:
   `http://192.168.4.1/data`
5. In SCOT, open the **Wearable** page and click **CONNECT DEVICE**.
6. Real-time accelerometer and gyroscope values will start streaming into the dashboard.

## 5. CORS Compatibility

The firmware sets the following headers on all HTTP responses:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS, POST`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`
- Responds with `204 No Content` to HTTP preflight `OPTIONS` requests.
