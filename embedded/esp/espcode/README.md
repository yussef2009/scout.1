# SCOT ESP32 + MPU6500 / MPU6050 Motion Sensor Firmware

Embedded firmware for real-time kinematic telemetry streaming to the SCOT sports performance web dashboard.

## 1. Hardware Required

- **Microcontroller**: ESP32 Development Board (ESP-WROOM-32 or compatible).
- **IMU Sensor**: GY-521 MPU-6050 or MPU-6500 / MPU-9250 6-Axis Motion Tracking Sensor (Accelerometer + Gyroscope).
- **Wiring**: 4 female-to-female jumper wires.
- **Power**: Micro-USB or 3.7V LiPo battery.

## 2. Wiring Diagram

| Sensor Pin | ESP32 Pin | Function |
| :--- | :--- | :--- |
| **VCC** | **3V3** | Power supply (3.3V) |
| **GND** | **GND** | System Ground |
| **SDA** | **GPIO 19** | I2C Data Line |
| **SCL** | **GPIO 18** | I2C Clock Line |
| **AD0** | Unconnected (or GND) | Sets I2C Address to `0x68` (or `0x69` if pulled HIGH) |
| **INT** | Unconnected | (Optional hardware interrupt) |

## 3. Building and Flashing via PlatformIO

### Prerequisites
- Install VS Code and the **PlatformIO IDE** extension.

### Build & Upload Commands
From the project root:

```bash
# Compile firmware
pio run

# Flash to connected ESP32
pio run --target upload

# Open serial monitor at 115200 baud
pio run --target monitor
```

## 4. Connecting to the SCOT Dashboard

You can connect your hardware to the SCOT software in two ways:

### Option A: Direct USB Cable (Web Serial API)
1. Keep the ESP32 connected to your computer via USB.
2. In the SCOT software, navigate to the **Wearable** page.
3. Select **USB Serial** and click **CONNECT USB PORT**.
4. Select the ESP32 COM port. Real-time telemetry will stream directly into the dashboard with zero network configuration!

### Option B: Local Wi-Fi Access Point (SoftAP)
1. Power on the ESP32.
2. Connect your laptop Wi-Fi to the open network:
   - **SSID**: `SCOT-Sensor`
   - **Password**: *(none by default)*
   - **Sensor IP**: `192.168.4.1`
3. Test in your browser: `http://192.168.4.1/data`
4. In the SCOT dashboard, navigate to the **Wearable** page and click **CONNECT DEVICE**.
