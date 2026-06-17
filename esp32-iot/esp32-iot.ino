// Firebase Realtime Database

#if defined(ESP32)
  #include <WiFi.h>
#elif defined(ESP8266)
  #include <ESP8266WiFi.h>
#endif

// Pastikan Anda menggunakan library Firebase_ESP_Client versi terbaru
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include "DHT.h"

// ================= PENGATURAN WIFI & FIREBASE =================
#define WIFI_SSID     "oths"
#define WIFI_PASSWORD "12345678"

#define API_KEY "AIzaSyBj6bhAq584TStUQDuP-Ee0rBuxnbjgyoA"
// CATATAN PENTING: Untuk DATABASE_URL, HAPUS "https://" di bagian depan
#define DATABASE_URL "dane-27e94-default-rtdb.firebaseio.com"
#define USER_EMAIL "msyahzidane@gmail.com"
#define USER_PASSWORD "Z1dan333."

// ================= KONFIGURASI PIN & HARDWARE =================
#if defined(ESP32)
  #define RELAY1 5
  #define RELAY2 18
  #define RELAY3 19
  #define RELAY4 23
  #define DHTPIN 4
#elif defined(ESP8266)
  #define RELAY1 5  // D1
  #define RELAY2 4  // D2
  #define RELAY3 0  // D3
  #define RELAY4 2  // D4
  #define DHTPIN 14 // D5
#endif

#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ================= LOGIKA RELAY (ACTIVE LOW) =================
#define RELAY_ON LOW
#define RELAY_OFF HIGH

// ================= OBJEK FIREBASE =================
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ================= VARIABEL TIMER =================
unsigned long previousMillisDHT = 0;
const long intervalDHT = 5000;       // Baca DHT tiap 5 detik

// Hapus interval pembacaan manual Firebase
// Kita akan menggunakan Firebase Stream (jauh lebih cepat dan responsif daripada polling)

void setup() {
  Serial.begin(115200);
  
  // Inisialisasi Pin Relay
  pinMode(RELAY1, OUTPUT);
  pinMode(RELAY2, OUTPUT);
  pinMode(RELAY3, OUTPUT);
  pinMode(RELAY4, OUTPUT);
  
  // Matikan semua relay di awal
  matikanSemuaRelay();

  dht.begin();

  // Koneksi WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Koneksi ke Wi-Fi");
  
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }

  Serial.println("\nTerhubung ke Wi-Fi!");
  Serial.print("Alamat IP: ");
  Serial.println(WiFi.localIP());

  // Konfigurasi Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Autentikasi Pengguna
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  // Callbacks
  config.token_status_callback = tokenStatusCallback; // Memerlukan TokenHelper.h

  // Memulai Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Set Firebase Timeout dan Size
  Firebase.RTDB.setMaxRetry(&fbdo, 3);
  Firebase.RTDB.setMaxErrorQueue(&fbdo, 10);
  
  // Mulai memonitor perubahan data (Stream) secara realtime pada node /IoT
  if (!Firebase.RTDB.beginMultiPathStream(&fbdo, "/IoT")) {
    Serial.printf("Stream Error: %s\n", fbdo.errorReason().c_str());
  } else {
    Serial.println("Berhasil menyambungkan ke Firebase Stream!");
  }
}

void loop() {
  unsigned long currentMillis = millis();

  // ================= BACA SENSOR DHT & KIRIM =================
  if (currentMillis - previousMillisDHT >= intervalDHT) {
    previousMillisDHT = currentMillis;

    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (!isnan(h) && !isnan(t)) {
      Serial.printf("Suhu: %.2f C | Kelembapan: %.2f %%\n", t, h);

      if (Firebase.ready()) {
        Firebase.RTDB.setFloatAsync(&fbdo, "/IoT/Suhu", t);
        Firebase.RTDB.setFloatAsync(&fbdo, "/IoT/Kelembapan", h);
      }
    } else {
      Serial.println("Gagal membaca sensor DHT!");
    }
  }

  // ================= BACA STATUS RELAY DARI FIREBASE (STREAM) =================
  if (Firebase.ready() && Firebase.RTDB.readStream(&fbdo)) {
    if (fbdo.streamTimeout()) {
      Serial.println("Stream timeout, resume streaming...");
    }
    
    if (fbdo.streamAvailable()) {
      Serial.printf("Terdapat perubahan data di Path: %s, Tipe: %s\n", fbdo.dataPath().c_str(), fbdo.dataType().c_str());
      
      // Jika stream menerima JSON (saat pertama kali connect)
      if (fbdo.dataType() == "json") {
         FirebaseJson *json = fbdo.to<FirebaseJson *>();
         FirebaseJsonData jsonData;
         
         if (json->get(jsonData, "Relay1")) digitalWrite(RELAY1, jsonData.boolValue ? RELAY_ON : RELAY_OFF);
         if (json->get(jsonData, "Relay2")) digitalWrite(RELAY2, jsonData.boolValue ? RELAY_ON : RELAY_OFF);
         if (json->get(jsonData, "Relay3")) digitalWrite(RELAY3, jsonData.boolValue ? RELAY_ON : RELAY_OFF);
         if (json->get(jsonData, "Relay4")) digitalWrite(RELAY4, jsonData.boolValue ? RELAY_ON : RELAY_OFF);
      } 
      // Jika stream menerima perubahan pada atribut spesifik
      else {
        String path = fbdo.dataPath();
        bool isOn = fbdo.boolData();

        if (path == "/Relay1") digitalWrite(RELAY1, isOn ? RELAY_ON : RELAY_OFF);
        else if (path == "/Relay2") digitalWrite(RELAY2, isOn ? RELAY_ON : RELAY_OFF);
        else if (path == "/Relay3") digitalWrite(RELAY3, isOn ? RELAY_ON : RELAY_OFF);
        else if (path == "/Relay4") digitalWrite(RELAY4, isOn ? RELAY_ON : RELAY_OFF);
      }
    }
  }
}

// ================= FUNGSI BANTUAN =================
void matikanSemuaRelay() {
  digitalWrite(RELAY1, RELAY_OFF);
  digitalWrite(RELAY2, RELAY_OFF);
  digitalWrite(RELAY3, RELAY_OFF);
  digitalWrite(RELAY4, RELAY_OFF);
}
