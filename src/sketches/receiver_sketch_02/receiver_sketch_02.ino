#include <esp_now.h>
#include <esp_wifi.h>
#include <WiFi.h>
#include <time.h>
#include "custom_wifi_init.h"
#include <Wire.h>
#include <WiFiClientSecure.h>
#include <Adafruit_GFX.h>
#include "Adafruit_LEDBackpack.h"
#include "esp_wpa2.h"  

char server[] = "ingress.opensensemap.org";

WiFiClientSecure client;

const char SENSOR_ID8B7[] PROGMEM = "65a41c9e99aa070008b3eb70";
const char SENSOR_ID8B6[] PROGMEM = "65a41c9e99aa070008b3eb71";
const char SENSOR_ID8B5[] PROGMEM = "65a41c9e99aa070008b3eb72";

//define senseBoxID obtained from openSenseMap 
static const uint8_t NUM_SENSORS = 200;
const char SENSEBOX_ID[] PROGMEM = "65a41c9e99aa070008b3eb6f";

// Certificate 
// SHA1 fingerprint is broken. using root SDRG Root X1 valid until 04 Jun 2035
// 11:04:38 GMT ISRGRootX1.crt
const char* root_ca =
    "-----BEGIN CERTIFICATE-----\n"
    "MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n"
    "TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n"
    "cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\n"
    "WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\n"
    "ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\n"
    "MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc\n"
    "h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+\n"
    "0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U\n"
    "A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW\n"
    "T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH\n"
    "B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC\n"
    "B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv\n"
    "KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn\n"
    "OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn\n"
    "jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw\n"
    "qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI\n"
    "rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV\n"
    "HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq\n"
    "hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL\n"
    "ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ\n"
    "3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK\n"
    "NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5\n"
    "ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur\n"
    "TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC\n"
    "jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc\n"
    "oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq\n"
    "4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA\n"
    "mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d\n"
    "emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=\n"
    "-----END CERTIFICATE-----\n";

// MAC adress
// uint8_t myAddress[] = {0x4D, 0x61, 0x72, 0x74, 0x69, 0x02};
uint8_t myAddress[] = {0x4E, 0xA1, 0x72, 0x74, 0x69, 0x02};

typedef struct data
{
  int decibel;
  // time_t measurement_time;
  int64_t sending_time;
  int64_t latency;

} data;


// define structure of datatype measurement 
typedef struct measurement {
  const char* sensorId;
  float value;
}; 

// struct to store incoming data
data stationMsg;
// array to to store the data of each sensor in
data sensors[3];

// storage for raw time
struct timeval tv_now;

// NTP Server for time synchronization
const char *ntpServer = "pool.ntp.org";

#define SoundSensorPin 3  // this pin read the analog voltage from the sound level meter
#define VREF  5.0 // voltage on AREF pin,default:operating voltage

const int measurementInterval = 125; // in ms
const int receivingInterval = 1000; // in ms
const int sendingInterval = 60000;  // in ms

unsigned long currentMillis = 0;
unsigned long previousMillis = 0;
unsigned long previousSecond = 0; // last time, the sensor was read
float dbaSum = 0;                 // Sum of the dBA-values per sendingInterval
float dbaMax = 0;                 // Max dBA-Value per sendingInterval
int readingCount = 0;             // Count readings per sendingInterval
int sendingCounter = 1;
int averageDbaValueM10 = 0;
bool connected = false;


void onMessageReceived(const uint8_t *macAddr, const uint8_t *incomingData, int len)
{
  memcpy(&stationMsg, incomingData, sizeof(stationMsg));
  sensors[macAddr[5]].decibel = stationMsg.decibel;
  gettimeofday(&tv_now, NULL);
  int64_t seconds = (int64_t)tv_now.tv_sec;
  sensors[macAddr[5]].latency = (seconds - stationMsg.sending_time);
}

// define array for measurements with beforehand defined datatype 
char buffer[750];  // might be too short for many phenomenons
measurement measurements[NUM_SENSORS];
uint8_t num_measurements = 0;
const int lengthMultiplikator = 35;

// function to add measurement to measurements array 
void addMeasurement(const char* sensorId, float value) {
  measurements[num_measurements].sensorId = sensorId;
  measurements[num_measurements].value = value;
  num_measurements++;
}
// function to add measurements to the client 
void writeMeasurementsToClient() {
  // iterate throug the measurements array
  for (uint8_t i = 0; i < num_measurements; i++) {
    sprintf_P(buffer, PSTR("%s,%9.2f\n"), measurements[i].sensorId,
              measurements[i].value);
    // transmit buffer to client
    client.print(buffer);
    Serial.print(buffer);
  }
  // reset num_measurements
  num_measurements = 0;
} 

void submitValues() {
  // check if still connected
  Serial.println(WiFi.status());
  while (WiFi.status() != WL_CONNECTED) {
    Serial.println("Connection to WiFi lost. Reconnecting.");
    initHomeWifi("MagentaWLAN-CCKB");
  }

  for (uint8_t timeout = 2; timeout != 0; timeout--) {
    Serial.println(F("\nconnecting..."));
    connected = client.connect(server, 443);
    if (connected == true) {
      // construct the HTTP POST request:
      Serial.println("OSeM connected");
      sprintf_P(buffer,
                PSTR("POST /boxes/%s/data HTTP/1.1\nAuthorization: "
                     "80d04ba62692e411cbb5c89e50e768a7e380f431c38c3406c4c38268bf69a293" // insert access token obtained from OpenSenseMap 
                     "\nHost: %s\nContent-Type: "
                     "text/csv\nConnection: close\nContent-Length: %i\n\n"),
                SENSEBOX_ID, server,
                (num_measurements * lengthMultiplikator) - 1);
      // send the HTTP POST request:
      Serial.print(buffer);
      client.print(buffer);
      // send measurements
      writeMeasurementsToClient();
      // send empty line to end the request
      client.println();

      // read server answer
      while (client.connected()) {
        String line = client.readStringUntil('\n');
        if (line == "\r") {
          Serial.println("headers received");
          break;
        }
      }

      // read them and print incoming bytes:
      while (client.available()) {
        char c = client.read();
        Serial.write(c);
      }
      Serial.println();

      num_measurements = 0;
      break;
    }
    delay(1000);
  }
}


//Adafruit_BicolorMatrix matrix = Adafruit_BicolorMatrix();
Adafruit_8x8matrix matrix = Adafruit_8x8matrix();

void setup()
{

  Serial.begin(115200);
  delay(3000);

  analogReadResolution(13);

  srand(1);


  // estatblish wifi connection
  //initUniWiFi("uni-ms");
  initHomeWifi("MagentaWLAN-CCKB"); // for testing
  Serial.println(WiFi.status());

  client.setCACert(root_ca);

  Serial.println("synchronizing NTP Server");
  // time server synchronization
  // ACHTUNG GEHT 1 STUNDE FALSCH
  configTime(1, 0, ntpServer);

  // wait some time to ensure synchronization
  delay(10000);
  Serial.println("NTP Server synchronized");

  WiFi.mode(WIFI_STA);
  Serial.print("Old ESP Board MAC Address:  ");
  Serial.println(WiFi.macAddress());
  // if (esp_wifi_set_mac(WIFI_IF_STA, myAddress) != ESP_OK) {Serial.println("Fehler");}
  Serial.println(esp_wifi_set_mac(WIFI_IF_STA, myAddress));
  Serial.print("New ESP Board MAC Address:  ");
  Serial.println(WiFi.macAddress());

  if (esp_now_init() == ESP_OK)
  {
    Serial.println("ESPNow Init success");
  }
  else
  {
    Serial.println("ESPNow Init fail");
    return;
  }

  esp_now_register_recv_cb(onMessageReceived);
  matrix.begin(0x70); // pass in the address
}

static const uint8_t PROGMEM
    smile_bmp[] =
        {B00111100,
         B01000010,
         B10100101,
         B10000001,
         B10100101,
         B10011001,
         B01000010,
         B00111100},
    neutral_bmp[] =
        {B00111100,
         B01000010,
         B10100101,
         B10000001,
         B10111101,
         B10000001,
         B01000010,
         B00111100},
    frown_bmp[] =
        {B00111100,
         B01000010,
         B10100101,
         B10000001,
         B10111101,
         B10100101,
         B01000010,
         B00111100};



void loop()
{

  if(WiFi.status() != WL_CONNECTED) {
    initHomeWifi("MagentaWLAN-CCKB");
  }
  unsigned long currentMillis = millis(); // current time in ms

  if (currentMillis - previousMillis >= measurementInterval) 
  {
    float voltageValue,dbaValue;
    voltageValue = analogReadMilliVolts(SoundSensorPin) / 1000.0; // measure Voltage of Sensor
    dbaValue = voltageValue * 50.0;  //convert voltage to decibel value
    //print measurements for testing:
    //Serial.print(dbaValue,1);
    //Serial.println(" dBA");

    // update global variables:
    dbaSum += pow(10,(dbaValue / 10.0));
    readingCount++;
    previousMillis = currentMillis;
  }  

  // check if receivingInterval expired
  if (currentMillis - previousSecond >= receivingInterval)
  {
    // fetch current time
    // Serial.print("Current seconds since 01.01.1970 ");
    // gettimeofday(&tv_now, NULL);
    // int64_t seconds = (int64_t)tv_now.tv_sec;
    // Serial.print(seconds);
    // Serial.print("\n");
    
    // Calculate average DBA-Value and cast into int for efficient communication
    // ATTENTION: For better accuracy the value is multiplicated by 10 before the cast
    averageDbaValueM10 = int(10 * 10 * log10(dbaSum / readingCount));

    //Serial.println("Average dBA-Value in last " + String(sendingInterval) + " ms: " + String(averageDbaValueM10));

    if (averageDbaValueM10 < 500)
    {
      matrix.clear();
      //matrix.drawBitmap(0, 0, smile_bmp, 8, 8, LED_GREEN);
      matrix.drawBitmap(0, 0, smile_bmp, 8, 8, LED_ON);
      matrix.writeDisplay();
    }
    else if (averageDbaValueM10 < 600) // 5 dBA lower than the 45dBA threshold
    {
      matrix.clear();
      //matrix.drawBitmap(0, 0, neutral_bmp, 8, 8, LED_YELLOW);
      matrix.drawBitmap(0, 0, neutral_bmp, 8, 8, LED_ON);
      matrix.writeDisplay();
    }
    else
    {
      matrix.clear();
      //matrix.drawBitmap(0, 0, frown_bmp, 8, 8, LED_RED);
      matrix.drawBitmap(0, 0, frown_bmp, 8, 8, LED_ON);
      matrix.writeDisplay();
    }



    float secondValues[3];
    secondValues[0] = 0.0;
    secondValues[1] = 0.0;
    secondValues[2] = averageDbaValueM10/10;

    for (int i = 0; i < 2; i++)
    {
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

    Serial.print("Sensor ");
    Serial.print("Receiver");
    Serial.println(":");
    Serial.print("Decibel [dB]: ");
    Serial.println(secondValues[2]);
    Serial.print("Latency [s]: ");
    Serial.println(0);
    Serial.println();

    addMeasurement(SENSOR_ID8B7, secondValues[0]);
    addMeasurement(SENSOR_ID8B6, secondValues[1]);
    addMeasurement(SENSOR_ID8B5, secondValues[2]);

    dbaSum=0;
    readingCount=0;
    previousSecond = currentMillis;
  }

  // check if sendingInterval expired
  if (currentMillis >= sendingInterval * sendingCounter)
  {
    Serial.println(WiFi.status());
    // Calculate average DBA-Value and cast into int for efficient communication
    // ATTENTION: For better accuracy the value is multiplicated by 10 before the cast
    int averageDbaValueM10 = int(10 * 10 * log10(dbaSum / (readingCount * 3)));
    Serial.println("Average dBA-Value in last " + String(sendingInterval) + " ms: " + String(averageDbaValueM10));

    Serial.println("start upload");
    submitValues();
    
    
    // update global variables:
    sendingCounter++;
    dbaSum = 0;
    readingCount = 0;
  }
}