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
import { uploadImage } from "@/services/api";

export default function Capture() {
  const isFocused = useIsFocused();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [libPermission, requestLibPermission] = ImagePicker.useMediaLibraryPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("Hello");

  // Auto-request camera permission
  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) requestPermission();
  }, [permission]);

  if (!permission)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  if (!permission.granted)
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

  const toggleFacing = () => setFacing((cur) => (cur === "back" ? "front" : "back"));

  const onCapture = async () => {
    if (!cameraRef.current || busy) return;
    try {
      setBusy(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });
      if (photo?.uri) setPhotoUri(photo.uri);
    } finally {
      setBusy(false);
    }
  };

  const pickFromLibrary = async () => {
    try {
      let granted = libPermission?.granted;
      if (!granted) {
        const res = await requestLibPermission();
        granted = res?.granted;
      }
      if (!granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) setPhotoUri(result.assets[0].uri);
    } catch (err) {
      console.error("Library pick failed", err);
    }
  };

  const handleUpload = async () => {
    if (!photoUri) return;
    try {
      setBusy(true);
      const data = await uploadImage(photoUri);
      setResult(data.text);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setBusy(false);
    }
  };

  const resetCapture = () => {
    setPhotoUri(null);
    setResult("");
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

      {busy && (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <View className="absolute bottom-12 left-0 right-0 px-8">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={toggleFacing}
            className="h-12 w-12 rounded-full bg-white/15 items-center justify-center"
          >
            <FontAwesome name="refresh" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={photoUri ? undefined : onCapture}
            disabled={busy || !!photoUri}
            className="h-16 w-16 rounded-full items-center justify-center border-4 border-white"
          >
            <View className="h-12 w-12 rounded-full bg-white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickFromLibrary}
            disabled={busy}
            className="h-12 w-12 rounded-md bg-white/15 items-center justify-center"
          >
            <FontAwesome name="image" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {photoUri && (
          <View className="mt-4 flex-row justify-center gap-4">
            <TouchableOpacity onPress={resetCapture} className="px-4 py-2 rounded-md bg-white/15">
              <Text className="text-white font-semibold">Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickFromLibrary}
              className="px-4 py-2 rounded-md bg-white/15"
            >
              <Text className="text-white font-semibold">Choose Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleUpload} className="px-4 py-2 rounded-md bg-indigo-600">
              <Text className="text-white font-semibold">
                {busy ? "Processing..." : "Extract Text"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {result ? (
          <View className="mt-4 p-4 bg-white/10 rounded-lg">
            <Text className="text-white font-semibold mb-2">Extracted Text:</Text>
            <Text className="text-white">{result}</Text>
          </View>
        ) : null}
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
