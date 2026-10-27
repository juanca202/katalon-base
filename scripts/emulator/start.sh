#!/usr/bin/env bash
# Arranca el emulador Android para las pruebas móviles de Katalon y espera a que
# termine de iniciar. Crea el AVD si no existe.
#
# Uso: scripts/emulator/start.sh [avd]
# Variables: AVD_NAME (qa-pixel-35), ANDROID_API (35), ANDROID_IMAGE
# (google_apis; google_apis_playstore para apps que exigen Google Play),
# ANDROID_HOME, HEADLESS, AVD_RAM (MB, 4096) y AVD_CORES (4)
# (sin ventana; por defecto solo en CI, localmente se abre la ventana).
set -euo pipefail

AVD="${1:-${AVD_NAME:-qa-pixel-35}}"
API="${ANDROID_API:-35}"
SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
case "$(uname -m)" in arm64 | aarch64) ABI=arm64-v8a ;; *) ABI=x86_64 ;; esac
IMAGE_TAG="${ANDROID_IMAGE:-google_apis}"
IMAGE="system-images;android-${API};${IMAGE_TAG};${ABI}"
export PATH="$SDK/emulator:$SDK/platform-tools:$SDK/cmdline-tools/latest/bin:$PATH"

for tool in emulator adb avdmanager sdkmanager; do
  command -v "$tool" >/dev/null || {
    echo "No se encontró '$tool'. Instala Android SDK (cmdline-tools, emulator, platform-tools) y define ANDROID_HOME." >&2
    exit 1
  }
done

if ! emulator -list-avds | grep -qx "$AVD"; then
  echo "Creando AVD $AVD ($IMAGE)..."
  # `yes` termina con SIGPIPE al cerrar sdkmanager; con pipefail eso abortaría.
  (yes || true) | sdkmanager --install "$IMAGE" >/dev/null || true
  [ -d "$SDK/system-images/android-${API}/${IMAGE_TAG}/${ABI}" ] || {
    echo "No se pudo instalar $IMAGE; reintenta o instálala desde Android Studio (SDK Manager)." >&2
    exit 1
  }
  echo no | avdmanager create avd -n "$AVD" -k "$IMAGE" -d pixel_6 --force >/dev/null
fi

# 2 GB de RAM (el valor por defecto) y render por software dejan a la app, Chrome
# y Google Play sin memoria: el guest se cuelga y adb lo ve como "offline".
CONFIG="$HOME/.android/avd/$AVD.avd/config.ini"
set_config() {
  if grep -q "^$1=" "$CONFIG"; then sed -i.bak "s|^$1=.*|$1=$2|" "$CONFIG"; else echo "$1=$2" >>"$CONFIG"; fi
}
if [ -f "$CONFIG" ] && ! adb devices | grep -q '^emulator-'; then
  set_config hw.ramSize "${AVD_RAM:-4096}"
  set_config hw.cpu.ncore "${AVD_CORES:-4}"
  set_config hw.gpu.enabled yes
  rm -f "$CONFIG.bak"
fi

if adb devices | grep -q '^emulator-'; then
  echo "Ya hay un emulador en ejecución."
  exit 0
fi

HEADLESS="${HEADLESS:-${CI:+true}}"
FLAGS=(-avd "$AVD" -no-audio -no-boot-anim -no-snapshot)
if [ "$HEADLESS" = "true" ]; then
  FLAGS+=(-no-window -gpu swiftshader_indirect)
else
  FLAGS+=(-gpu host)
fi
LOG="${TMPDIR:-/tmp}/emulator-$AVD.log"
nohup emulator "${FLAGS[@]}" >"$LOG" 2>&1 &

echo "Esperando a que $AVD termine de iniciar (log: $LOG)..."
# Esperar al emulador por su serial: con un dispositivo físico conectado,
# `adb wait-for-device` volvería de inmediato con el teléfono.
SERIAL=""
for _ in $(seq 1 60); do
  SERIAL="$(adb devices | awk '/^emulator-[0-9]+[[:space:]]+device/ {print $1; exit}')"
  [ -n "$SERIAL" ] && break
  sleep 2
done
[ -n "$SERIAL" ] || { echo "El emulador no apareció en adb; revisa $LOG" >&2; exit 1; }
for _ in $(seq 1 120); do
  [ "$(adb -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] && { echo "Emulador listo: $SERIAL"; exit 0; }
  sleep 3
done
echo "El emulador no terminó de iniciar; revisa $LOG" >&2
exit 1
