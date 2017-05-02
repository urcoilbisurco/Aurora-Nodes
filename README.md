
## Aurora Things
Espruino code for JS-devices connected with Aurora-Server

## Setup
You need to have an ESP8266 microcontroller.
Flash it with https://github.com/thingsSDK/flasher.js
Then follow the instruction on this page for setup the client:
https://github.com/thingsSDK/thingssdk-cli

## Installation

create an "_env.js" file with inside:

```javascript
export default env=[
  "http://xxx.com", //URL of aurora-server
  "XX.XX.XX.XX", //IP address of MQTT server
  1883 //port of MQTT server
];
```

Also, use

```
C.setupPin(PIN)
```

to setup the pin used for the Access Point button.

Then run

```
  npm install
  npm run dev
```


## Todo
- [ ] if C.pin is not defined, then C.start_setup is called automatically on Wi-Fi error.
