#!/usr/bin/env bash
# Arranca el emulador Android para las pruebas de Maestro y espera a que
# termine de iniciar. Crea el AVD si no existe.
#
# Uso: scripts/emulator/start.sh [avd]
# Variables: AVD_NAME (qa-pixel-35), ANDROID_API (35), ANDROID_HOME, HEADLESS (true)
set -euo pipefail

AVD="${1:-${AVD_NAME:-qa-pixel-35}}"
API="${ANDROID_API:-35}"
SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
case "$(uname -m)" in arm64 | aarch64) ABI=arm64-v8a ;; *) ABI=x86_64 ;; esac
IMAGE="system-images;android-${API};google_apis;${ABI}"
export PATH="$SDK/emulator:$SDK/platform-tools:$SDK/cmdline-tools/latest/bin:$PATH"

for tool in emulator adb avdmanager sdkmanager; do
  command -v "$tool" >/dev/null || {
    echo "No se encontró '$tool'. Instala Android SDK (cmdline-tools, emulator, platform-tools) y define ANDROID_HOME." >&2
    exit 1
  }
done

if ! emulator -list-avds | grep -qx "$AVD"; then
  echo "Creando AVD $AVD ($IMAGE)..."
  yes | sdkmanager --install "$IMAGE" >/dev/null
  echo no | avdmanager create avd -n "$AVD" -k "$IMAGE" -d pixel_6 --force >/dev/null
fi

if adb devices | grep -q '^emulator-'; then
  echo "Ya hay un emulador en ejecución."
  exit 0
fi

FLAGS=(-avd "$AVD" -no-audio -no-boot-anim -no-snapshot -gpu swiftshader_indirect)
[ "${HEADLESS:-true}" = "true" ] && FLAGS+=(-no-window)
nohup emulator "${FLAGS[@]}" >/dev/null 2>&1 &

echo "Esperando a que $AVD termine de iniciar..."
adb wait-for-device
until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 3; done
echo "Emulador listo: $(adb devices | grep '^emulator-' | cut -f1)"
