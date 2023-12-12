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

const int receivingInterval = 1000; // in ms
const int sendingInterval = 60000; // in ms

unsigned long previousMillis = 0; // last time, the sensor was read
float dbaSum = 0; // Sum of the dBA-values per sendingInterval
float dbaMax = 0; // Max dBA-Value per sendingInterval
int readingCount = 0; // Count readings per sendingInterval
int sendingCounter = 1;

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
  //initHomeWifi("") // for testing
  
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
  unsigned long currentMillis = millis(); // current time in ms
  // check if receivingInterval expired
  if (currentMillis - previousMillis >= receivingInterval) 
  {
    // fetch current time
    // Serial.print("Current seconds since 01.01.1970 ");
    // gettimeofday(&tv_now, NULL);
    // int64_t seconds = (int64_t)tv_now.tv_sec;
    // Serial.print(seconds);
    // Serial.print("\n");
    
    float secondValues[3];

    for(int i=0; i<3; i++){
      // Change dBA*10 ints to normal dBA floats
      secondValues[i] = sensors[i].decibel / 10.0;
      Serial.print("Sensor ");
      Serial.print(i);
      Serial.println(":");
      Serial.print("Decibel [dB]: ");
      Serial.println(secondValues[i]);
      Serial.print("Latency [s]: ");
      Serial.println(sensors[i].latency);
      Serial.println();
    }

    // calculate max_dBA per receivingInterval
    float max_dBA = 0;
    if (secondValues[0] >= secondValues[1])
    {
      if (secondValues[0] >= secondValues[2])
      {
        max_dBA = secondValues[0];
      }
      else
      {
        max_dBA = secondValues[2];
      }
    }
    else
    {
      if (secondValues[1] >= secondValues[2])
      {
        max_dBA = secondValues[1];
      }
      else
      {
        max_dBA = secondValues[2];
      }
    }
    // TODO: visualize max_dBA

    // update global variables:
    if (max_dBA > dbaMax)
    {
      dbaMax = max_dBA;
    }
    dbaSum += secondValues[0] + secondValues[1] + secondValues[2];
    readingCount++;
    previousMillis = currentMillis;
  }

  // check if sendingInterval expired
  if (currentMillis >= sendingInterval * sendingCounter) 
  {
    // Calculate average DBA-Value and cast into int for efficient communication
    // ATTENTION: For better accuracy the value is multiplicated by 10 before the cast
    int averageDbaValueM10 = int(dbaSum * 10 / (readingCount * 3));
    Serial.println("Average dBA-Value in last " + String(sendingInterval) + " ms: " + String(averageDbaValueM10));
    int maxDbaValueM10 = int(dbaMax * 10);
    Serial.println("Max dBA-Value in last " + String(sendingInterval) + " ms: " + String(maxDbaValueM10));
    Serial.println(readingCount);
    // TODO: send maximum and average every min for reporting to opensensemap-cloud
    
    // update global variables:
    sendingCounter++;
    dbaSum=0;
    dbaMax=0;
    readingCount=0;
  }
}