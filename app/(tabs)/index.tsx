import { useRef, useState } from 'react';
import { AntDesign } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PhotoPreviewSection from '@/components/PhotoPreviewSection';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function Camera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [photos, setPhotos] = useState<CameraCapturedPicture[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const camRef = useRef<CameraView | null>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const toggleFacing = () => setFacing(f => (f === 'back' ? 'front' : 'back'));

  const snapWithCountdown = async () => {
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await sleep(1000);
    }
    setCountdown(null);

    if (!camRef.current) return;
    const shot = await camRef.current.takePictureAsync({ quality: 1, base64: true, exif: false });
    setPhotos(p => [...p, shot]);
  };

  const snapFour = async () => {
    if (busy) return;
    setBusy(true);
    setPhotos([]);
    for (let i = 0; i < 4; i++) await snapWithCountdown();
    setBusy(false);
  };

  const reset = () => setPhotos([]);

  if (photos.length === 4) {
    return <PhotoPreviewSection photo={photos} handleRetakePhoto={reset} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={toggleFacing} disabled={busy}>
          <AntDesign name="retweet" size={40} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={snapFour} disabled={busy}>
          <AntDesign name="camera" size={40} color="black" />
        </TouchableOpacity>
      </View>

      <CameraView style={styles.camera} facing={facing} ref={camRef}>
        {countdown !== null && (
          <View style={styles.countdown}>
            <Text style={styles.countText}>{countdown}</Text>
          </View>
        )}
      </CameraView>

      <Image
        source={require('@/assets/images/LogoBlack.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' },
  text: { color: 'white', marginBottom: 12, textAlign: 'center' },

  camera: { width: '100%', aspectRatio: 4 / 3, borderRadius: 20, overflow: 'hidden' },

  buttons: {
    position: 'absolute',
    top: 120,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 50,
    zIndex: 10,
  },
  button: { padding: 20, backgroundColor: 'white', borderRadius: 50 },

  countdown: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  countText: { fontSize: 80, fontWeight: 'bold', color: 'white' },

  logo: { position: 'absolute', top: 775, width: 400, alignSelf: 'center' },
});