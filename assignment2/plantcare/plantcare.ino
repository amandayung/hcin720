//Firmware for monitoring plant status
//Mositure sensor code was modeled after:
//https://learn.sparkfun.com/tutorials/sparkfun-inventors-kit-for-photon-experiment-guide/all#experiment-3-houseplant-monitor

//This file was compiled via Particle Build

// This library was included by the Particle IDE
//check their github library for the library code
#include "SparkJson/SparkJson.h"

//parameters for photoresistor
const int photoresistorPin = A0;
int amountDarkness = 0;

//parameters for moisture sensor
const int moistureSensor = A1;
const int moisturePower = D2;
int moisture = 0;

//parameters for playing music
const int speakerPin = D0;
const int songLength = 9;

//timing variables
unsigned long startTime = 0;
unsigned long intervalCheck = 5000;

//song to play (Final Fantasy fanfare by Nobuo Uematsu)
//sheet music found at:
//http://www.vgmpf.com/Wiki/index.php?title=Victory_Fanfare
char notes[] = "ddddAcdcd"; 

//timing for each note
// A "1" represents an eighth note, 2 a quarter note, etc.
// I'm not entirely sure what 3 would be equivalent to, but
//this sounded right
int beats[] = {1,1,1,3,3,3,2,1,6};

int tempo = 135;


void setup() {
    Serial.begin(9600);
    
    //set pin for power for soil moisture sensor
    pinMode(moisturePower, OUTPUT);
    digitalWrite(moisturePower, LOW); //set to low so that no power is going through
    
    //set speaker pin for output
    pinMode(speakerPin, OUTPUT);
    
    //set up callback to play music
    Spark.function("fanfare", playFanfare);
    
    //inital start time
    startTime = millis();
}

void loop() {
    unsigned long currentTime = millis();
    
    //using an if statement so that it can be open for receiving commands
    if (currentTime - startTime > intervalCheck) {
        
        //send the data out
        sendData();
        
         //reset start time
        startTime = millis();
    }
    
}

//get light measurement from photoresistor
int getLight() {
    amountDarkness = analogRead(photoresistorPin);
    return amountDarkness;
}

//read soil mositure level
int readSoil() {
    digitalWrite(moisturePower, HIGH); //turn power on to moisture sensor
    delay(10); //wait until the sensor gets power
    moisture = analogRead(moistureSensor);
    digitalWrite(moisturePower, LOW);//turn D6 "Off"
    return moisture; 
}


//send all the collected data through the serial port/to the cloud
void sendData() {
        //creating a JSON buffer to write to the serial port
        //code modeled after the example given by the SparkJson library:
       // https://github.com/menan/SparkJson
        StaticJsonBuffer<200> jsonBuffer;
    
        JsonObject& data = jsonBuffer.createObject();
        data["time"] = millis();
        data["photoresistor"] = getLight();
        data["moisture_sensor"] = readSoil();
        
        //send data through the serial port
        data.printTo(Serial);
        Serial.println(); //for parsing the data correctly via server.js
        
        //and also to the cloud
        char dataBuffer[256];
        data.printTo(dataBuffer, sizeof(dataBuffer));
        Spark.publish("readings", dataBuffer);
        
}


//this function and its helper function frequency are modeled after
//the sparkfun music tutorial:
//https://learn.sparkfun.com/tutorials/sparkfun-inventors-kit-for-photon-experiment-guide/experiment-5-music-time
int playFanfare(String command) {
    if (command == "play") {
        int i, duration;
    
        for (i = 0; i < songLength; i++) {
            duration = beats[i] * tempo;  // length of note/rest in ms
            
            tone(speakerPin, frequency(notes[i]), duration);
            delay(duration); // wait for tone to finish
            
            delay(tempo/10); // brief pause between notes
        }
        return 0;
    }
   else {
        return -1;
    }

}


// This function takes a note character, and returns the
// corresponding frequency in Hz for the tone() function.
int frequency(char note) {

    int i;
    const int numNotes = 3;  // number of notes we're storing
    
    //capital letters indicate sharp note
    //5th octave sounded the best
    //note frequencies:
    //https://www.arduino.cc/en/Tutorial/ToneMelody?from=Tutorial.Tone
    char names[] = {'d', 'A', 'c'};
    int frequencies[] = {587, 466, 523};
    //int frequencies[] = {1175, 932, 1047};
    
    // Now we'll search through the letters in the array, and if
    // we find it, we'll return the frequency for that note.
    
    //find the right note
    for (i = 0; i < numNotes; i++) {
        if (names[i] == note) {
            return(frequencies[i]); 
        }
    }
    return(0); 
}