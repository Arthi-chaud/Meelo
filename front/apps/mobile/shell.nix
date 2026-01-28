{
  pkgs ? import <nixpkgs> {
    config = {
      android_sdk.accept_license = true;
      allowUnfree = true;
    };
  },
}:

let
  androidSdk = pkgs.androidenv.composeAndroidPackages {
    platformToolsVersion = "36.0.0";
    buildToolsVersions = [ "36.0.0" ];
    platformVersions = [ "36" ];
    emulatorVersion = "36.4.2";
    abiVersions = [ "arm64-v8a" ];
    includeEmulator = true;
    includeSystemImages = true;
    includeNDK = true;
    ndkVersions = [ "27.1.12297006" ];
    systemImageTypes = [ "google_apis" ]; # NOTE: sth else for non aarch
  };
in
pkgs.mkShell rec {
  JAVA_HOME = pkgs.jdk17.home;
  # ANDROID_HOME = "${androidSdk.androidsdk}/libexec/android-sdk";
  # ANDROID_SDK_ROOT = ANDROID_HOME;
  # ANDROID_SDK_ROOT = "${androidSdk.androidsdk}/libexec/android-sdk";
  # ANDROID_NDK_ROOT = "${ANDROID_SDK_ROOT}/ndk-bundle";
  # ANDROID_SDK_ROOT = ".android/sdk";
  # ANDROID_AVD_HOME = ".android/avd";
  # ANDROID_USER_HOME = ".android";
  # ANDROID_HOME = ANDROID_SDK_ROOT;
  # GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${ANDROID_HOME}/build-tools/36.0.0/aapt2";

  # ANDROID_AVD_HOME = "$HOME/.android/avd";
  # ANDROID_USER_HOME = "$HOME/.android";
  # ANDROID_EMULATOR_USE_SYSTEM_LIBS = 1;
  # PATH = [
  #   "${ANDROID_HOME}/emulator"
  #   "${ANDROID_HOME}/platform-tools"
  #   "${ANDROID_HOME}/cmdline-tools/latest/bin"
  # ];

  packages = with pkgs; [
    nodejs_24
    yarn
    jdk17
    watchman

    androidSdk.androidsdk
  ];
  shellHook = ''
    mkdir -p "$ANDROID_SDK_ROOT"
    mkdir -p "$ANDROID_AVD_HOME"

    # Make Nix SDK tools visible to Android tooling
    ln -sf ${androidSdk.androidsdk}/libexec/android-sdk/* "$ANDROID_SDK_ROOT/"
  '';

  # echo "echo no | avdmanager create avd -n pixel -k 'system-images;android-36;google_apis;arm64-v8a'"
}
