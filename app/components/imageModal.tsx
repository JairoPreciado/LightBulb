import React from "react"
import { Modal, View, Image, TouchableOpacity, StyleSheet, Text, Pressable } from "react-native"

interface Props {
  visible: boolean
  onClose: () => void
  source?: any
  children?: React.ReactNode
}

const ImageModal = ({ visible, onClose, source, children }: Props) => (
  <Modal visible={visible} transparent animationType="fade">
    <Pressable style={styles.backdrop} onPress={onClose}>
      <View style={styles.modalContent}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        {source ? (
          <Image source={source} style={styles.image} resizeMode="contain" />
        ) : (
          <Text style={{ color: "#fff", marginTop: 20 }}>Imagen no disponible</Text>
        )}
        {children}
      </View>
    </Pressable>
  </Modal>
)

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center" },
  modalContent: {
    width: "90%",
    height: "80%",
    backgroundColor: "#222",
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  closeButton: { position: "absolute", top: 10, right: 10, zIndex: 10 },
  closeText: { fontSize: 28, color: "#fff" },
})

export default ImageModal
