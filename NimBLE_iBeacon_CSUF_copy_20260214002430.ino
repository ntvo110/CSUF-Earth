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

// According to Apple, it's important to have a 100ms advertising time
#define BEACON_ADVERTISING_TIME	160   // 100ms
#define SERVICE_UUID ""

NimBLEServer *pServer;

// Hey, you! Replace this with your own unique UUID with something like https://www.uuidgenerator.net/
const char* iBeaconUUID = "";

void init_service(){
	NimBLEAdvertising *pAdvertising;
	pAdvertising = pServer->getAdvertising();
	pAdvertising->stop();

	NimBLEService *pService = pServer->createService(BLEUUID(SERVICE_UUID));

	pAdvertising->addServiceUUID(BLEUUID(SERVICE_UUID));

	pService->start();
	pAdvertising->start();
}


void setup() {
	pinMode(3, OUTPUT);
	digitalWrite(3, LOW);
	pinMode(14, OUTPUT);
	digitalWrite(14, HIGH);
	
	NimBLEDevice::init("Nav 3");
	pServer = NimBLEDevice::createServer();

	init_service();
	// Create beacon object
	NimBLEBeacon beacon;
	beacon.setMajor(0000);
	beacon.setMinor(103);
	beacon.setSignalPower(0xC5); // Optional
	beacon.setProximityUUID(BLEUUID(iBeaconUUID)); // Unlike Bluedroid, you do not need to reverse endianness here

	// Create advertisement data
 	NimBLEAdvertisementData beaconAdvertisementData;
	beaconAdvertisementData.setFlags(0x04); // BR_EDR_NOT_SUPPORTED
	beaconAdvertisementData.setManufacturerData(beacon.getData());

	// Start advertising
	NimBLEAdvertising *advertising = NimBLEDevice::getAdvertising();
	advertising->setAdvertisingInterval(BEACON_ADVERTISING_TIME);
	advertising->setAdvertisementData(beaconAdvertisementData);
	advertising->start();
}

void loop() {}
