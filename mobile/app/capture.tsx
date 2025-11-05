import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Linking,
  StyleSheet,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as ImagePicker from "expo-image-picker";

export default function Capture() {
  const isFocused = useIsFocused();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [libPermission, requestLibPermission] = ImagePicker.useMediaLibraryPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Auto-request permission
  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) requestPermission();
  }, [permission]);

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-center pb-2">We need your permission to show the camera.</Text>
        <TouchableOpacity
          className="px-4 py-2 rounded-md bg-indigo-600"
          onPress={requestPermission}
        >
          <Text className="text-white font-semibold">Grant permission</Text>
        </TouchableOpacity>
        {Platform.OS === "ios" && (
          <TouchableOpacity className="mt-3" onPress={() => Linking.openSettings()}>
            <Text className="text-xs text-blue-600">Open Settings</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const toggleFacing = () => setFacing((cur) => (cur === "back" ? "front" : "back"));

  const onCapture = async () => {
    if (!cameraRef.current || busy) return;
    try {
      setBusy(true);
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: true,
      });
      if (result && "uri" in result && result.uri) {
        setPhotoUri(result.uri);
      }
    } finally {
      setBusy(false);
    }
  };

  const pickFromLibrary = async () => {
    try {
      // Request permission if needed
      let granted = libPermission?.granted;
      if (!granted) {
        const res = await requestLibPermission();
        granted = res?.granted;
      }
      if (!granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      // no-op
    }
  };

  return (
    <View className="flex-1 bg-black">
      {isFocused && !photoUri ? (
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
      ) : photoUri ? (
        <Image source={{ uri: photoUri }} className="flex-1" resizeMode="cover" />
      ) : (
        <View className="flex-1 bg-black" />
      )}

      {/* Controls */}
      <View className="absolute bottom-12 left-0 right-0 px-8">
        <View className="flex-row items-center justify-between">
          {/* Flip */}
          <TouchableOpacity
            onPress={toggleFacing}
            className="h-12 w-12 rounded-full bg-white/15 items-center justify-center"
          >
            <FontAwesome name="refresh" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Shutter */}
          <TouchableOpacity
            onPress={photoUri ? undefined : onCapture}
            disabled={busy || !!photoUri}
            className="h-16 w-16 rounded-full items-center justify-center border-4 border-white"
          >
            <View className="h-12 w-12 rounded-full bg-white" />
          </TouchableOpacity>

          {/* Gallery */}
          <TouchableOpacity
            onPress={pickFromLibrary}
            disabled={busy}
            className="h-12 w-12 rounded-md bg-white/15 items-center justify-center"
          >
            <FontAwesome name="image" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Preview actions */}
        {photoUri && (
          <View className="mt-4 flex-row justify-center gap-4">
            <TouchableOpacity
              onPress={() => setPhotoUri(null)}
              className="px-4 py-2 rounded-md bg-white/15"
            >
              <Text className="text-white font-semibold">Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickFromLibrary}
              className="px-4 py-2 rounded-md bg-white/15"
            >
              <Text className="text-white font-semibold">Choose Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // Use the photo URI here (upload, navigate, etc.)
                // console.log(photoUri);
              }}
              className="px-4 py-2 rounded-md bg-indigo-600"
            >
              <Text className="text-white font-semibold">Use Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    backgroundColor: "#000",
  },
});
