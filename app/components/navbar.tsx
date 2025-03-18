"use client"

import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from "react-native"
import { useRouter, usePathname } from "expo-router"
import { ChevronLeft, Settings as SettingsIcon } from "lucide-react-native"

interface NavbarProps {
  title: string
  showBackButton?: boolean
  showSettingsButton?: boolean
  onSettingsPress: () => void
}

const Navbar = ({ title, showBackButton = true, showSettingsButton = true, onSettingsPress }: NavbarProps) => {
  const router = useRouter()
  const pathname = usePathname()

  // No mostrar el botón de regreso si una main viwe
  const shouldShowBackButton =
    showBackButton &&
    ![
      "/controlLightBulb/home",
      "/controlLightBulb/devices/listDevices",
      "/controlLightBulb/guideUser",
      "/controlLightBulb/controllers/addControllers",
    ].includes(pathname)

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#007BFF" barStyle="light-content" />
      <View style={styles.content}>
        {shouldShowBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>

        {showSettingsButton ? (
          <TouchableOpacity style={styles.settingsButton} onPress={onSettingsPress}>
            <SettingsIcon color="#FFFFFF" size={22} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  )
}

const STATUSBAR_HEIGHT = Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 0

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#007BFF",
    paddingTop: STATUSBAR_HEIGHT,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  content: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  title: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  placeholder: {
    width: 40,
  },
})

export default Navbar

