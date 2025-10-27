import React from "react";
import { View } from "react-native";

// This screen exists only to satisfy the file-based router for the Capture tab.
// The actual action is handled by the custom tabBarButton that navigates to /modal.
export default function CapturePlaceholder() {
  return <View />;
}
