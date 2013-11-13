// include the neo pixel library
#include <Adafruit_NeoPixel.h>

// how many leds in our string?
static const int NUM_LEDS = 96;

// Parameter 1 = number of pixels in strip
// Parameter 2 = pin number (most are valid)
// Parameter 3 = pixel type flags, add together as needed:
//   NEO_RGB     Pixels are wired for RGB bitstream
//   NEO_GRB     Pixels are wired for GRB bitstream
//   NEO_KHZ400  400 KHz bitstream (e.g. FLORA pixels)
//   NEO_KHZ800  800 KHz bitstream (e.g. High Density LED strip)
Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_LEDS, 6, NEO_RGB + NEO_KHZ800);

// buffer to hold colors of our LEDs
char colorValues[NUM_LEDS*3];
char buffer[NUM_LEDS*3];
int index = 0;
boolean bufferReady = true;
boolean secondBuffer = false;

void setup() {
  strip.begin();
  strip.show();

  // initialize to black (off)
  for (int i=0; i < NUM_LEDS; i++) {
    int d = i*3;
    colorValues[d] = 255;
    colorValues[d+1] = 0;
    colorValues[d+2] = 255;
    buffer[d] = 0;
    buffer[d+1] = 0;
    buffer[d+2] = 0;
  }

  // initialize the strip to the current values
  for(int i=0; i<NUM_LEDS; i++) {
    int d = i*3;
    uint32_t c = strip.Color(colorValues[d], colorValues[d+1], colorValues[d+2]);
    strip.setPixelColor(i, c);
  }
  // update the strip
  strip.show();

   //Initialize serial and wait for port to open:
  Serial.begin(115200);
  while (!Serial) {
    ; // wait for port
  }
}

void loop() {
  // wait for bytes on serial port
  /*if (Serial.available() > 0) {
    // read 3 bytes per LED from serial port
    char bytesRead = Serial.readBytes(colorValues, NUM_LEDS*3);
    // check we got a full complement of bytes
    if (bytesRead < NUM_LEDS*3) {
      // something went wrong, abandon this loop
      return;
    }
    // feed the data to the leds
    for(int i=0; i<NUM_LEDS; i++) {
      int d = i*3;
      uint32_t c = strip.Color(colorValues[d+1], colorValues[d], colorValues[d+2]);
      strip.setPixelColor(i, c);
    }
    // update the strip
    strip.show();
  }*/

 while (Serial.available() > 0) {
   char c = Serial.read();
   colorValues[index++] = c;
   if (index >= NUM_LEDS*3) {
    index = 0;
   // set data!
    bufferReady = true; 
    break;
   }
 } 
  if (bufferReady) {
    for(int i=0; i<NUM_LEDS; i++) {
      int d = i*3;
      uint32_t c = strip.Color(colorValues[d+1], colorValues[d], colorValues[d+2]);
      strip.setPixelColor(i, c);
    }
    // update the strip
    strip.show();
    bufferReady = false;
    Serial.write(1);  

 }
}
