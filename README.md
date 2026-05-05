# CSUF Earth

CSUF Earth is a mobile application designed to help students and visitors navigate campus efficiently. By combining interative maps, real-time navigation, and indoor positioning, the app provides step-by-step gidance to classrooms and campus locations, reducing confusion and improving on-time arrival.

## Features

1. search system - find classrooms and buildings quickly through a catalog
2. interactive campus map - explore campus with a dynamic map interface
3. real-time navigation - get step-by-step directions to any classroom
4. indoor positioning - uses Bluetooth Low Energy (BLE) beacons for indoor guidance
5. User Authentication - Secure login and user management
6. Schedule builder - save a classoom and start time for use later on

## Tech Stack

### Frontend:
- React (React Native)
- TypeScript
- JavaScript
- Expo Go
### Backend & Services:
- Google Firebase (Firestore, Authentication)
- Google Maps API
### Hardware / Indoor Navigation:
- Bluetooth 5.0 Low Energy (BLE) Beacons
- Bilateration positioning method

## Installation
### Prerequisites
- Node.js (v16+)
- npm or yarn
- Expo CLI
- Mobile device with Expo Go installed

Steps
```
# Clone the repository
git clone https://github.com/your-repo/csuf-earth.git

# Navigate into the project
cd csuf-earth

# Install dependencies
npm install

# Start the development server
npx expo start
```
## Project Structure

```
csuf-earth/
|-- app/              # main pages for the application
|-- assets/images/    # Images, floor plans
|-- components/       # Reusable UI components
```
## Contributors 
- Nathan Vo
- Xareni Merino Rita
- Edward Valencia
- Citlali Cortes Garcia
- Nicholas Perez
