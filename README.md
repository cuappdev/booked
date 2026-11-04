# Booked – Cornell Libraries

<p align="center">
  <img src="https://github.com/user-attachments/assets/f9aca7bd-8fcf-476c-9bb5-83d71e22139d" alt="booked-icon-512x" width="200"/>
</p>

Booked is a mobile app built to help Cornell students easily browse and reserve study spaces across campus. Designed with usability and accessibility in mind, Booked integrates with Cornell’s official reservation systems to streamline the process of finding and booking library rooms.

Maintained by [Cornell AppDev](https://www.cornellappdev.com/).

# Preview
<img src="https://github.com/user-attachments/assets/583bf5aa-a77d-4250-b04a-4afa9c634f25" alt="booked-ss1" width="160"/>
<img src="https://github.com/user-attachments/assets/62d3e23a-76f8-46c7-ba87-2be6a55cdbca" alt="booked-ss2" width="160"/>
<img src="https://github.com/user-attachments/assets/4a2bbe96-6f4e-45cb-986a-fffd0a50b079" alt="booked-ss3" width="160"/>
<img src="https://github.com/user-attachments/assets/e6e6a3e4-dee1-4d73-8ed9-a3a09ab0e57c" alt="booked-ss4" width="160"/>


# 🚀 Features
- 🔍 Library Explorer View with list/grid toggle
- 🎯 Filter & Search by noise level, features, space type, and more
- 📄 Detailed Space Pages with photos, amenities, and reservation info
- 🔗 Direct Reservation Routing through in-app browser
- 🗺️ Google Maps Integration for live navigation to any study spot

# 🧰 Tech Stack
## Frontend
- React + Expo (React Native)
- React Context & Hooks for state management
- Google Maps JavaScript API
- Figma (for UI/UX design)

## Backend
- [booked-backend](https://github.com/cuappdev/booked-backend): Express, TypeScript and PostgreSQL
- Syncs spaces and libraries from the Cornell Library API every hour; the app reads them from the backend

# 📱 Try It Out
- iOS: [App Store Listing](https://apps.apple.com/us/app/booked-cornell-libraries/id6745230909)
- Android: [Play Store Listing](https://play.google.com/store/apps/details?id=com.cornellappdev.booked)

# 🛠 Development
## Prerequisites
- Node.js & npm
- Expo CLI
- A running [booked-backend](https://github.com/cuappdev/booked-backend) (see its README)

## Run Locally
Point the app at your backend by copying `.env.example` to `.env.local` and
setting `EXPO_PUBLIC_API_URL`. `localhost` works in the iOS simulator; on a
physical device or Android emulator, use your computer's LAN IP instead.

```
git clone https://github.com/jjennifergu/booked.git
cd booked
npm install
cp .env.example .env.local
npx expo start
```

## Deployment
- V1 built and submitted using [Expo EAS](https://docs.expo.dev/deploy/build-project/)
- Refer to AppDev internal documentation for App Store and Play Store submission guides

# 📎 Resources
- 🎨 [Figma Design File](https://www.figma.com/design/UxcbbAZnIegmorPpFbcjkg/Booked?node-id=0-1&t=IwJDSi8oXufQT4rf-1)

