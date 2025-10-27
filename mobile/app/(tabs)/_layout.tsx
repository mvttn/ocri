import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter } from "expo-router";
import { View, Pressable } from "react-native";
import { BottomTabBar, type BottomTabBarProps } from "@react-navigation/bottom-tabs";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: 0 }} {...props} />;
}

function CustomTabBar(props: BottomTabBarProps) {
  const router = useRouter();

  return (
    <View className="relative">
      <BottomTabBar {...props} />
      {/* Center Floating Button */}
      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 items-center bottom-12 z-10"
      >
        <Pressable
          onPress={() => router.push("/")}
          accessibilityRole="button"
          accessibilityLabel="Create new entry"
          className="h-16 w-16 rounded-full items-center justify-center bg-indigo-500 shadow-lg"
          style={{ shadowColor: "#6366F1", elevation: 8 }}
        >
          <FontAwesome name="pencil" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarShowLabel: true,
        tabBarItemStyle: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarStyle: {
          backgroundColor: "transparent", // avoid 'inherit' in RN
          marginHorizontal: 0,
          marginBottom: 24,
          height: 64,
          position: "absolute",
          overflow: "hidden",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: "Timeline",
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
