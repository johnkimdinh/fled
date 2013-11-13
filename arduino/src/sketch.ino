// include the neo pixel library
#include <Adafruit_NeoPixel.h>

// how many leds in our string?
static const int NUM_LEDS = 96; //=21*6;
static const int TOTAL_BYTES = NUM_LEDS*3;

// Parameter 1 = number of pixels in strip
// Parameter 2 = pin number (most are valid)
// Parameter 3 = pixel type flags, add together as needed:
//   NEO_RGB     Pixels are wired for RGB bitstream
//   NEO_GRB     Pixels are wired for GRB bitstream
//   NEO_KHZ400  400 KHz bitstream (e.g. FLORA pixels)
//   NEO_KHZ800  800 KHz bitstream (e.g. High Density LED strip)
Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_LEDS, 6, NEO_RGB + NEO_KHZ800);

// buffer to hold colors of our LEDs
int ledIndex = 0;
char buf[3];

void setup() {
  strip.begin();
  strip.show();

  // initialize the strip to the current values
  for(int i=0; i<NUM_LEDS; i++) {
    int d = i*3;
    uint32_t c = strip.Color(255,0,0);
    strip.setPixelColor(i, c);
  }
  // update the strip
  strip.show();

  //Initialize serial and wait for port to open:
  Serial.begin(250000);
  while (!Serial) {
    ; // wait for port
  }
}
int nonZeroIndex = 0;

char state = 3;

unsigned char r = 0;
unsigned char g = 0;
unsigned char b = 0;

unsigned char getByte() {
 while (Serial.available()==0) {
 }
 return Serial.read();
}

unsigned char frameCount = 0;
unsigned char lastFrame = 0;

void loop() {  
 unsigned char r = 0;
 int seekCount = 0;
 int syncCount = 0;
 do {
   r = getByte(); 
   seekCount++;
 } while (r!=255);
 
 // now c has first sync byte
 do {
  frameCount = getByte();
  syncCount++;
 } while (frameCount==255);
  
  // read remaining data into leds
  while (ledIndex < NUM_LEDS) {
    while (Serial.available() < 3) {
    }
    unsigned char count =  Serial.readBytes(buf,3);
    uint32_t c = strip.Color(buf[0],buf[2],buf[1]);
    //if (ledIndex < 30) {
      strip.setPixelColor(ledIndex,c);
//    }      
    ledIndex++;
  }
  strip.show();
  
  if (frameCount-lastFrame!=1) {
     Serial.print("Dropped:");
     unsigned char count = frameCount-lastFrame;
     Serial.println(count,DEC);
     Serial.print("Expected:");
     Serial.print(lastFrame+1,DEC);
     Serial.print(" Received:");
     Serial.println(frameCount,DEC);
     Serial.flush();
  }
  
  lastFrame = frameCount;
  /*Serial.print("Seek:");
  Serial.println(seekCount,DEC);
  Serial.print("Sync:");
  Serial.println(syncCount,DEC);
  Serial.print("FrameCount:");
  Serial.println(frameCount,DEC);
  Serial.flush();*/
  ledIndex = 0;
}


