#ifndef WIFI_INIT_H
#define WIFI_INIT_H

#include "credentials.h"


void initHomeWifi(const char *ssid)
{
  WiFi.begin(ssid, HOME_PASSWORD);
   
  Serial.print("Connecting to WiFi ..");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(1000);
  }
  Serial.println("Success!");
  Serial.println(WiFi.localIP());
}

// set ESP32 mode to station and connect to SSID
void initUniWiFi(const char *ssid) {
  WiFi.mode(WIFI_STA);
  // Example1 (most common): a cert-file-free eduroam with PEAP (or TTLS)
  WiFi.begin(ssid, WPA2_AUTH_PEAP, EAP_IDENTITY, EAP_USERNAME, EAP_PASSWORD);
  Serial.print("Connecting to WiFi ..");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(1000);
  }
  Serial.println("Success!");
  Serial.println(WiFi.localIP());
}
#endif