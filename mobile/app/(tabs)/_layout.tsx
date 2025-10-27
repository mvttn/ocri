import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Easing,
  StyleSheet,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from "react-native";
import { BottomTabBar, type BottomTabBarProps } from "@react-navigation/bottom-tabs";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: 0 }} {...props} />;
}

function CenterFab() {
  const router = useRouter();

  // Animation values
  const progress = React.useRef(new Animated.Value(0)).current; // 0 closed -> 1 open
  const scale = React.useRef(new Animated.Value(1)).current;

  // State/refs
  const [expanded, setExpanded] = React.useState(false);
  const expandedByTapRef = React.useRef(false);
  const holdTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const armedRef = React.useRef(false);
  const dxRef = React.useRef(0);
  const gestureStartRef = React.useRef(0);
  const [activeSide, setActiveSide] = React.useState<"left" | "right" | null>(null);

  // Config
  const HOLD_DELAY = 220; // ms to arm drag selection
  const THRESHOLD = 56; // px to select side on release
  const OPTION_DIST = 52; // px options slide out (kept close to center)

  const expand = (byTap: boolean) => {
    expandedByTapRef.current = byTap;
    setExpanded(true);
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, { toValue: 1.06, useNativeDriver: true }),
    ]).start();
  };

  const collapse = () => {
    setExpanded(false);
    setActiveSide(null);
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const startHold = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      armedRef.current = true;
      if (!expanded) {
        expand(false); // expand due to hold
      }
    }, HOLD_DELAY);
  };

  const clearHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    armedRef.current = false;
  };

  const navigateTo = (side: "left" | "right") => {
    if (side === "left") {
      router.push("/capture");
    } else {
      router.push("/new_entry");
    }
  };

  const onRelease = () => {
    const dt = Date.now() - gestureStartRef.current;
    const dx = dxRef.current;
    const moved = Math.abs(dx) > 8;

    // If armed (held), decide by threshold
    if (armedRef.current) {
      clearHold();
      if (dx <= -THRESHOLD) {
        collapse();
        navigateTo("left");
        return;
      }
      if (dx >= THRESHOLD) {
        collapse();
        navigateTo("right");
        return;
      }
      // Not past threshold: if expanded came from hold, collapse; else keep expanded
      if (!expandedByTapRef.current) collapse();
      return;
    }

    // Not armed: treat as tap
    if (!moved && dt < 220) {
      if (expanded) collapse();
      else expand(true);
    }
  };

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          dxRef.current = 0;
          gestureStartRef.current = Date.now();
          startHold();
        },
        onPanResponderMove: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
          dxRef.current = g.dx;
          if (expanded || armedRef.current) {
            if (g.dx <= -20) setActiveSide("left");
            else if (g.dx >= 20) setActiveSide("right");
            else setActiveSide(null);
          }
        },
        onPanResponderRelease: () => {
          onRelease();
          clearHold();
        },
        onPanResponderTerminate: () => {
          clearHold();
          // If expansion came from hold, collapse on cancel
          if (!expandedByTapRef.current) collapse();
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [expanded]
  );

  // Animated styles
  const leftOptionStyle = {
    opacity: progress,
    transform: [
      { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -OPTION_DIST] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
    ],
  };

  const rightOptionStyle = {
    opacity: progress,
    transform: [
      { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, OPTION_DIST] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
    ],
  };

  const optionsRowStyle = {
    transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -48] }) },
    ],
  };

  // Dim overlay opacity
  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.22], // ~22% black
  });

  return (
    // Full-screen overlay host
    <View pointerEvents="box-none" className="absolute inset-0">
      {/* Visual dim overlay */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}
        className="bg-black z-10"
      />
      {/* Tap-capture layer: collapse when tapping outside */}
      <View
        pointerEvents={expanded ? "auto" : "none"}
        style={StyleSheet.absoluteFill}
        className="z-20"
        onStartShouldSetResponder={() => true}
        onResponderRelease={collapse}
      />

      {/* FAB and options, centered above the tab bar */}
      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 items-center bottom-[56px] z-30"
      >
        {/* Options row (tap targets appear when expanded) */}
        <Animated.View
          pointerEvents={expanded ? "auto" : "none"}
          className="absolute left-0 right-0 flex-row items-center justify-center"
          style={[{ zIndex: 20 }, optionsRowStyle]}
        >
          {/* Left: Capture */}
          <Animated.View style={leftOptionStyle} className="mr-3">
            <TouchableOpacity
              onPress={() => {
                collapse();
                navigateTo("left");
              }}
              accessibilityRole="button"
              accessibilityLabel="Capture"
              className="items-center"
              activeOpacity={0.8}
            >
              <View
                className={`h-14 w-14 rounded-full items-center justify-center shadow-lg ${
                  activeSide === "left" ? "bg-primary" : "bg-white"
                }`}
                style={{ elevation: 6 }}
              >
                <FontAwesome
                  name="camera"
                  size={20}
                  color={activeSide === "left" ? "#FFFFFF" : "#111111"}
                />
              </View>
              <Text
                className={`mt-1 text-xs ${
                  activeSide === "left" ? "text-primary font-semibold" : "text-neutral-800"
                }`}
              >
                Capture
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Right: Write */}
          <Animated.View style={rightOptionStyle} className="ml-3">
            <TouchableOpacity
              onPress={() => {
                collapse();
                navigateTo("right");
              }}
              accessibilityRole="button"
              accessibilityLabel="Write new entry"
              className="items-center"
              activeOpacity={0.8}
            >
              <View
                className={`h-14 w-14 rounded-full items-center justify-center shadow-lg ${
                  activeSide === "right" ? "bg-primary" : "bg-white"
                }`}
                style={{ elevation: 6 }}
              >
                <FontAwesome
                  name="pencil"
                  size={20}
                  color={activeSide === "right" ? "#FFFFFF" : "#111111"}
                />
              </View>
              <Text
                className={`mt-1 text-xs ${
                  activeSide === "right" ? "text-primary font-semibold" : "text-neutral-800"
                }`}
              >
                New Entry
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Main FAB */}
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel="Create: tap to expand, or hold and drag"
          className={`h-[4.5rem] w-[4.5rem] rounded-full items-center justify-center shadow-lg ${
            expanded ? "bg-primary" : "bg-primary"
          }`}
          style={{ transform: [{ scale }], elevation: 8, zIndex: 30 }}
          {...panResponder.panHandlers}
        >
          <FontAwesome name={expanded ? "close" : "plus"} size={24} color="#FFFFFF" />
        </Animated.View>
      </View>
    </View>
  );
}

function CustomTabBar(props: BottomTabBarProps) {
  // Only render the base bar here. The FAB and overlay are rendered at layout root.
  return (
    <View className="relative">
      <BottomTabBar {...props} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <View className="flex-1">
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
            backgroundColor: "transparent",
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

      {/* Center FAB + full-screen overlay */}
      <CenterFab />
    </View>
  );
}
