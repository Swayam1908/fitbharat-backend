@echo off
echo Running create-expo-app...
call npx -y create-expo-app FitBharat --template blank
if %errorlevel% neq 0 exit /b %errorlevel%

cd FitBharat
echo Installing navigation...
call npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
call npx expo install react-native-screens react-native-safe-area-context

echo Installing UI & Animation...
call npx expo install expo-blur expo-linear-gradient
call npm install moti
call npx expo install react-native-reanimated

echo Installing Fonts...
call npx expo install expo-font @expo-google-fonts/dm-sans @expo-google-fonts/playfair-display

echo Installing Storage & HTTP...
call npx expo install @react-native-async-storage/async-storage
call npm install axios

echo Installing Icons & Skia & Gesture Handler...
call npx expo install @expo/vector-icons
call npx expo install @shopify/react-native-skia
call npx expo install react-native-gesture-handler

echo Done.
