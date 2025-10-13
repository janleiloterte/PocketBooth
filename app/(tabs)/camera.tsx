import PhotoPreviewSection from '@/components/PhotoPreviewSection';
import { AntDesign } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTaking, setIsTaking] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePhotoWithCountdown = async () => {
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(res => setTimeout(res, 1000));
    }
    setCountdown(null);

    if (cameraRef.current) {
      const takenPhoto = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: true,
        exif: false,
      });
      setPhotos(prev => [...prev, takenPhoto]);
    }
  };

  const handleTakeThreePhotos = async () => {
    if (isTaking) return;
    setIsTaking(true);
    setPhotos([]); // clear previous ones
    for (let i = 0; i < 4; i++) {
      await takePhotoWithCountdown();
    }
    setIsTaking(false);
  };

  const handleRetakePhoto = () => setPhotos([]);

  if (photos.length === 4) {
    return <PhotoPreviewSection photo={photos} handleRetakePhoto={handleRetakePhoto} />;
  }

  return (
    <View style={styles.container}>
      {/* Buttons outside CameraView */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing} disabled={isTaking}>
          <AntDesign name="retweet" size={44} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleTakeThreePhotos} disabled={isTaking}>
          <AntDesign name="camera" size={44} color="black" />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {countdown !== null && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}
      </CameraView>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'black',
  },

  camera: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 20,
    overflow: 'hidden',
  },

  buttonContainer: {
    position: 'absolute',
    top: 125, // Adjust this as needed for padding from the top (e.g., status bar)
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    zIndex: 10,
  },

  button: {
    padding: 10,
    backgroundColor: 'gray',
    borderRadius: 10,
  },

  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  countdownText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: 'white',
  },
});
