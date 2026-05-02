/**
 *  iBeacon example
 *
 *  This example demonstrates how to publish an Apple-compatible iBeacon
 *
 *  Created: on May 26 2025
 *      Author: lazd
 */

#include <Arduino.h>
#include <NimBLEDevice.h>
#include <NimBLEBeacon.h>
#include <Preferences.h>

// According to Apple, it's important to have a 100ms advertising time
#define BEACON_ADVERTISING_TIME	160   // 100ms
#define SERVICE_UUID ""
#define CONFIG_SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define POWER_CHAR_UUID     "beb5483e-36e1-4688-b7f5-ea07361b26a8"

NimBLEServer *pServer;
NimBLEAdvertising *pAdvertising;
Preferences prefs;

// Hey, you! Replace this with your own unique UUID with something like https://www.uuidgenerator.net/
const char* iBeaconUUID = "38E026C3-4617-4A50-B75B-00B4AD51E9D7";

int8_t measuredPower = 0xC5;

void updateBeaconData() {
	NimBLEBeacon beacon;
	beacon.setMajor(0);
	beacon.setMinor(18);
	beacon.setSignalPower(measuredPower);
	beacon.setProximityUUID(BLEUUID(iBeaconUUID));

	NimBLEAdvertisementData beaconAdvertisementData;
	beaconAdvertisementData.setFlags(0x04);
	beaconAdvertisementData.setManufacturerData(beacon.getData());

	pAdvertising->setAdvertisementData(beaconAdvertisementData);

	NimBLEAdvertisementData scanResponseData;
	scanResponseData.setName("Nav 0 Config");
	pAdvertising->setScanResponseData(scanResponseData);
}

class PowerCharCallbacks: public NimBLECharacteristicCallbacks {
	void onWrite(NimBLECharacteristic* pCharacteristic){
		std::string rxValue = pCharacteristic->getValue();
		if (rxValue.length() > 0) {
			measuredPower = (int8_t)rxValue[0];
			Serial.printf("New Calibration power received: %d\n", measuredPower);

			prefs.begin("ibeacon", false);
			prefs.putChar("power", measuredPower);
			prefs.end();

			updateBeaconData();
			Serial.println("Beacon payload updated successfully.");
		}
	}
};

class ServerCallbacks: public NimBLEServerCallbacks {
	void onConnect(NimBLEServer* pServer) {
		Serial.println(" Success: Phone Connected.");
	}

	void onDisconnect(NimBLEServer* pServer) {
		Serial.println(" Phone Disconnected: Restarting iBeacon...");
		NimBLEDevice::startAdvertising();
	}
};

void setup() {
	Serial.begin(115200);
	
	// pinMode(3, OUTPUT);
	// digitalWrite(3, LOW);
	// pinMode(14, OUTPUT);
	// digitalWrite(14, HIGH);
	
	prefs.begin("ibeacon", true);
	if (prefs.isKey("power")){
		measuredPower = prefs.getChar("power");
		Serial.printf("Loaded saved power: %d\n", measuredPower);
	} else {
		Serial.println("No saved power found. Using default (-59).");
	}
	prefs.end();

	NimBLEDevice::init("Nav 0");
	pServer = NimBLEDevice::createServer();
	pServer->setCallbacks(new ServerCallbacks());
	pAdvertising = NimBLEDevice::getAdvertising();

	NimBLEService *pService = pServer->createService(CONFIG_SERVICE_UUID);
	NimBLECharacteristic *pCharacteristic = pService->createCharacteristic(
		POWER_CHAR_UUID,
		NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
	);

	pCharacteristic->setCallbacks(new PowerCharCallbacks());
	pCharacteristic->setValue((uint8_t*)&measuredPower, 1);

	// pService->start();

	updateBeaconData();

	pAdvertising->setAdvertisingInterval(BEACON_ADVERTISING_TIME);
	pAdvertising->start();

	Serial.println("iBeacon started. Ready for calibration.");
}

void loop() {
	// delay(2000);
}
