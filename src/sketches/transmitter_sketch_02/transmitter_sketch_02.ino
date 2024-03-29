#include <math.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <WiFi.h>
#include "custom_wifi_init.h"
#include <Adafruit_GFX.h>
#include "Adafruit_LEDBackpack.h"
#include "esp_wpa2.h" 
#include <Adafruit_NeoPixel.h> //Library Adafruit NeoMatrix required 
#ifdef __AVR__
 #include <avr/power.h>
#endif


// MAC adress
// uint8_t myAddress[] = {0x4D, 0x61, 0x72, 0x74, 0x69, 0x02};
uint8_t receiverAddress[] = {0x4E, 0xA1, 0x72, 0x74, 0x69, 0x03};
uint8_t myAddress[] = {0x4E, 0xA1, 0x72, 0x74, 0x69, 0x02};

// Information of the device to connect to
esp_now_peer_info_t peerInfo;

// data that will be send
typedef struct data
{
  int decibel;
  // time_t measurement_time;
  int64_t sending_time;
  int64_t latency;

} data;

// storage for the message to sent
data myMessage; 

// storage for raw time
struct timeval tv_now;

// NTP Server for time synchronization
const char* ntpServer = "pool.ntp.org";

#define SoundSensorPin 3  // this pin read the analog voltage from the sound level meter
#define VREF  5.0 // voltage on AREF pin,default:operating voltage

#define LED_PIN    5 // select PIN connected to matrix DIN0
#define LED_COUNT 64

const int measurementInterval = 125; // in ms
const int sendingInterval = 1000; // in ms

unsigned long previousMillis = 0; // last time, the sensor was read
float dbaSum = 0; // Sum of the dBA-values per sendingInterval
int readingCount = 0; // Count readings per sendingInterval
int sendingCounter = 1; // Count sendings

void messageSent(const uint8_t *macAddr, esp_now_send_status_t status) {
  Serial.print("Send status: ");
  if(status == ESP_NOW_SEND_SUCCESS){
    Serial.println("Success");
  }
  else{
    Serial.println("Error");
  }
}

// initialize LED-Matrix
Adafruit_NeoPixel strip = Adafruit_NeoPixel(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);


// function to show green happy face 
void smileFace () { 
  int smileyArr[LED_COUNT] = {
    0,0,1,1,1,1,0,0,
    0,1,0,0,0,0,1,0,
    1,0,1,0,0,1,0,1,
    1,0,0,0,0,0,0,1,
    1,0,1,0,0,1,0,1,
    1,0,0,1,1,0,0,1,
    0,1,0,0,0,0,1,0,
    0,0,1,1,1,1,0,0,
  };
  int col = 0;
  for (int i = 0; i < LED_COUNT; i++) {  
    strip.show();
    if(smileyArr[i] == 1) {
      col = 255;
    }
    strip.setPixelColor(i, 0, col, 0);
    col = 0;
    }
}


// function to show orange neutral face 
void neutralFace () { 
  int smileyArr[LED_COUNT] = {
    0,0,1,1,1,1,0,0,
    0,1,0,0,0,0,1,0,
    1,0,1,0,0,1,0,1,
    1,0,0,0,0,0,0,1,
    1,0,1,1,1,1,0,1,
    1,0,0,0,0,0,0,1,
    0,1,0,0,0,0,1,0,
    0,0,1,1,1,1,0,0,
  };
  int col1 = 0;
  int col2 = 0;
  for (int i = 0; i < LED_COUNT; i++) {  
    strip.show();
    if(smileyArr[i] == 1) {
      col1 = 255;
      col2 = 165;
    }
    strip.setPixelColor(i, col1, col2, 0);
    col1 = 0;
    col2 = 0;
    }
}


// function to show red frown face
void frownFace () { 
  int smileyArr[LED_COUNT] = {
    0,0,1,1,1,1,0,0,
    0,1,0,0,0,0,1,0,
    1,0,1,0,0,1,0,1,
    1,0,0,0,0,0,0,1,
    1,0,1,1,1,1,0,1,
    1,0,1,0,0,1,0,1,
    0,1,0,0,0,0,1,0,
    0,0,1,1,1,1,0,0,
  };
  int col = 0;
  for (int i = 0; i < LED_COUNT; i++) {  
    strip.show();
    if(smileyArr[i] == 1) {
      col = 255;
    }
    strip.setPixelColor(i, col, 0, 0);
    col = 0;
    }
}


void setup(){
  Serial.begin(115200);
  delay(3000);

  analogReadResolution(13);

  // intialize RNG
  srand(1);

  // estatblish wifi connection
  initUniWiFi("uni-ms");

  Serial.println("synchronizing NTP Server");
  // time server synchronization
  // ACHTUNG GEHT 1 STUNDE FALSCH
  configTime(1, 0, ntpServer);

  // wait some time to ensure synchronization
  delay(10000);
  Serial.println("NTP Server synchronized");

  //initialize ESP-NOW
  WiFi.mode(WIFI_STA);
  Serial.print("Old ESP Board MAC Address:  ");
  Serial.println(WiFi.macAddress());
  esp_wifi_set_mac(WIFI_IF_STA, myAddress);
  Serial.print("New ESP Board MAC Address:  ");
  Serial.println(WiFi.macAddress());  
  
  // test initialisation
  if (esp_now_init() == ESP_OK) {
    Serial.println("ESPNow Init success");
  }
  else {
    Serial.println("ESPNow Init fail");
    return;
  }
  
  esp_now_register_send_cb(messageSent);

  //setup LED-Matrix
  strip.begin();           
  strip.show();            
  strip.setBrightness(50); 

  delay(40);

  // set options for connection to peer device
  memcpy(peerInfo.peer_addr, receiverAddress, 6); // deep-copy cause of array immutability
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  // try to add peer
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }
}


void loop(){
  unsigned long currentMillis = millis(); // current time in ms

  // check if measurementInterval expired
  if (currentMillis - previousMillis >= measurementInterval) 
  {
    float voltageValue,dbaValue;
    voltageValue = analogReadMilliVolts(SoundSensorPin) / 1000.0; // measure Voltage of Sensor
    dbaValue = voltageValue * 50.0;  //convert voltage to decibel value

    // update global variables:
    dbaSum += pow(10,(dbaValue / 10.0));
    readingCount++;
    previousMillis = currentMillis;
  }

  // check if sendingInterval expired
  if (currentMillis >= sendingInterval * sendingCounter) 
  {
    // Calculate average DBA-Value and cast into int for efficient communication
    // ATTENTION: For better accuracy the value is multiplicated by 10 before the cast
    int averageDbaValueM10 = int(10 * 10 * log10(dbaSum / readingCount));
    
    // safe dBA-Value in message
    myMessage.decibel = averageDbaValueM10;

    // get current time in seconds
    gettimeofday(&tv_now, NULL);
    int64_t seconds = (int64_t)tv_now.tv_sec;

    myMessage.sending_time = seconds;
    esp_err_t result = esp_now_send(receiverAddress, (uint8_t *) &myMessage, sizeof(myMessage));
    if (result != ESP_OK) {
        Serial.println("Sending error");
    }
    Serial.println("Message send: ");
    Serial.print("Decibel [dB]: ");
    Serial.println(myMessage.decibel);
    Serial.print("Sending time [s sind 01.01.1970]: ");
    Serial.println(myMessage.sending_time);

    
    // decide which face the LED-Matrix should show
    if (averageDbaValueM10 < 450)
    {
	    smileFace();
    }
    else if (averageDbaValueM10 < 600) // 5 dBA lower than the 45dBA threshold
    {
	    neutralFace();
    }
    else
    {
	    frownFace();
    }

    // update global variables
    sendingCounter++;
    dbaSum=0;
    readingCount=0;
  }
}