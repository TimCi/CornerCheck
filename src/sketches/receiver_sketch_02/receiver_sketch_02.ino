#include <esp_now.h>
#include <esp_wifi.h>
#include <WiFi.h>
#include <time.h>
#include "custom_wifi_init.h"

// MAC adress 
uint8_t myAddress[] = {0x4D, 0x61, 0x72, 0x74, 0x69, 0x02};

typedef struct data {
    int decibel;
    // time_t measurement_time;
    int64_t sending_time;
    int64_t latency;
    
} data;

// struct to store incoming data
data stationMsg;
// array to to store the data of each sensor in
data sensors[3];

// storage for raw time
struct timeval tv_now;

// NTP Server for time synchronization
const char* ntpServer = "pool.ntp.org";


void onMessageReceived(const uint8_t* macAddr, const uint8_t* incomingData, int len){
  memcpy(&stationMsg, incomingData, sizeof(stationMsg));
  sensors[macAddr[5]].decibel = stationMsg.decibel;
  gettimeofday(&tv_now, NULL);
  int64_t seconds = (int64_t)tv_now.tv_sec;
  sensors[macAddr[5]].latency = (seconds - stationMsg.sending_time);
}

void setup(){
  
  Serial.begin(115200);

  // estatblish wifi connection
  initUniWiFi("uni-ms");
  
  Serial.println("synchronizing NTP Server");
  // time server synchronization
  // ACHTUNG GEHT 1 STUNDE FALSCH
  configTime(1, 0, ntpServer);

  // wait some time to ensure synchronization
  delay(10000);
  Serial.println("NTP Server synchronized");

  WiFi.mode(WIFI_STA);
  esp_wifi_set_mac(WIFI_IF_STA, myAddress);
  
  if (esp_now_init() == ESP_OK) {
      Serial.println("ESPNow Init success");
  }
  else {
      Serial.println("ESPNow Init fail");
      return;
  }

  esp_now_register_recv_cb(onMessageReceived);
}
 
void loop(){
  // fetch current time
  // Serial.print("Current seconds since 01.01.1970 ");
  // gettimeofday(&tv_now, NULL);
  // int64_t seconds = (int64_t)tv_now.tv_sec;
  // Serial.print(seconds);
  // Serial.print("\n");
  // delay(5000);

  
  for(int i=0; i<3; i++){
    Serial.print("Sensor ");
    Serial.print(i);
    Serial.println(":");
    Serial.print("Decibel [dB]: ");
    Serial.println(sensors[i].decibel);
    Serial.print("Latency [s]: ");
    Serial.println(sensors[i].latency);
    Serial.println();
  }
  Serial.println();


  for(int i=0;i<3;i++)
  {
    sensors[i].latency = 0;
    sensors[i].decibel = 0;
  }
  delay(5000);   
  
}