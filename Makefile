# Makefile for Expo mobile app

.PHONY: help start android ios web install lint stop clean \
	logs-android logs-expo adb-devices adb-reverse metro-status env-print \
	api-login ip info expo-lan expo-tunnel expo-reset ping cache-clear cache-reset expo-clear

help:
	@echo "Targets:"
	@echo "  make start   - Start Expo bundler"
	@echo "  make android - Run on Android emulator/device"
	@echo "  make ios     - Run on iOS simulator/device (macOS)"
	@echo "  make web     - Run in the browser"
	@echo "  make install - Install dependencies"
	@echo "  make lint    - Run ESLint"
	@echo "  make stop    - Attempt to stop Expo bundler"
	@echo "  make clean   - Remove node_modules and Expo caches"
	@echo "  make logs-android - Tail Android logs filtered for RN/Expo/network"
	@echo "  make logs-expo    - Tail Expo packager info and settings"
	@echo "  make adb-devices  - List connected Android devices"
	@echo "  make adb-reverse  - Setup port reverse (8081, 19000, 19001)"
	@echo "  make metro-status - Show processes/ports for Metro & Expo"
	@echo "  make env-print    - Print API env vars from .env"
	@echo "  make api-login    - Smoke test login API (override EMAIL/PASS)"
	@echo "  make ip           - Show local IP/network info"
	@echo "  make expo-lan     - Start Expo on LAN"
	@echo "  make expo-tunnel  - Start Expo with tunnel (ngrok)"
	@echo "  make expo-reset   - Clear Metro cache and restart"
	@echo "  make ping TARGET=IP - Ping a device on the LAN"

start:
	npm start

android:
	npm run android

ios:
	npm run ios

web:
	npm run web

install:
	npm install

lint:
	npx eslint . || true

# Best-effort kill of common Expo/Metro processes
stop:
	-pkill -f "expo start" || true
	-pkill -f "node .*expo" || true
	-pkill -f "metro" || true

clean:
	rm -rf node_modules .expo .expo-shared

# Lightweight cache purge & restart (retain node_modules)
cache-clear:
	@echo "Clearing Expo/Metro caches (retain node_modules)"
	rm -rf .expo .expo-shared
	find . -name "packager-info.json" -delete 2>/dev/null || true
	EXPO_DEBUG=0 npx expo start --clear

# Full reset including dependencies
cache-reset:
	@echo "Full cache & dependency reset"
	rm -rf node_modules .expo .expo-shared dist
	npm install
	EXPO_DEBUG=0 npx expo start --clear

expo-clear: cache-clear

# --- Diagnostics & Logs ---

# Tail useful Android logs for RN/Expo and network issues
logs-android:
	@echo "Tailing Android logs (press Ctrl+C to stop)"
	@adb logcat -v time | grep -i -E "ReactNativeJS|com.facebook.react|expo|Network|OkHttp|SSL|http|E/ReactNative|FATAL|crash" || true

# Show Expo's packager info and settings (updates as Expo runs)
logs-expo:
	@echo "Printing Expo packager info (if present)"
	@echo "--- .expo/packager-info.json ---" && cat .expo/packager-info.json 2>/dev/null || true
	@echo "--- .expo/settings.json ---" && cat .expo/settings.json 2>/dev/null || true

# List connected Android devices
adb-devices:
	adb devices -l || true

# Ensure Android device can reach Metro and Expo dev servers via USB
adb-reverse:
	@echo "Reversing ports for Metro (8081) and Expo (19000,19001)"
	-adb reverse tcp:8081 tcp:8081 || true
	-adb reverse tcp:19000 tcp:19000 || true
	-adb reverse tcp:19001 tcp:19001 || true

# Check if required ports are listening
metro-status:
	@echo "Processes using Metro/Expo ports (8081, 19000, 19001):"
	@ss -lntp | grep -E ":(8081|19000|19001)" || true
	@echo "Node processes (metro/expo):"
	@ps aux | grep -E "(expo start|metro)" | grep -v grep || true

# Print important environment variables
env-print:
	@echo "Environment (.env) values:"
	@grep -E '^(API_BASE_URL|API_TOKEN)=' .env 2>/dev/null || echo "No .env or vars missing"

# Quick API smoke test (override EMAIL and PASS)
# Usage: make api-login EMAIL=foo@example.com PASS=Passw0rd!
EMAIL ?= kima@web.de
PASS  ?= Passw0rd!
api-login:
	@API=$$(grep -E '^API_BASE_URL' .env | cut -d= -f2); \
	if [ -z "$$API" ]; then API=$${API_BASE_URL:-https://nzxf0l1n9b.execute-api.eu-central-1.amazonaws.com/dev}; fi; \
	echo "POST $$API/api/v1/auth/login as $(EMAIL)"; \
	curl -s -X POST "$$API/api/v1/auth/login" -H 'Content-Type: application/json' \
	  -d '{"email":"$(EMAIL)","password":"$(PASS)"}' | sed 's/"token":"[^"]\+"/"token":"***"/g' | jq .

# Show local IPs and default route (helpful for LAN issues)
ip:
	@echo "Local IPs:"
	@hostname -I 2>/dev/null || true
	@echo "Default route outbound IP:"
	@ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($$i=="src") {print $$(i+1); exit}}' || true

# Start Expo with LAN transport
expo-lan:
	npx expo start --lan

	@echo "  make cache-clear - Purge Expo caches & restart (fast)"
	@echo "  make cache-reset - Full reset incl. node_modules"
	@echo "  make expo-clear  - Alias for cache-clear"
# Start Expo with tunnel (useful when LAN discovery fails)
expo-tunnel:
	npx expo start --tunnel

# Clear caches and restart Expo with verbose logs
expo-reset:
	EXPO_DEBUG=1 npx expo start --clear

# Ping a specific IP on the network: make ping TARGET=192.168.1.23
TARGET ?=
ping:
	@if [ -z "$(TARGET)" ]; then \
	  echo "Please provide TARGET IP, e.g. make ping TARGET=192.168.1.23"; \
	else \
	  ping -c 4 $(TARGET); \
	fi
