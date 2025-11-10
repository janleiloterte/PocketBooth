import { Fontisto } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width: screenWidth } = Dimensions.get('window');

type Captured = { fileUri: string; base64: string };

const PhotoPreviewSection = ({
  photo,
  handleRetakePhoto,
}: {
  photo: CameraCapturedPicture[];
  handleRetakePhoto: () => void;
}) => {
  const [strip, setStrip] = useState<Captured | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stripRef = useRef<View | null>(null);

  const photoW = 200;
  const photoH = 125;
  const pad = 10;
  const margin = 20;
  const aspect = 637.5 / 1650;
  const canvasW = photoW + 2 * margin;
  const canvasH = canvasW / aspect;

  useEffect(() => {
    const makeStrip = async () => {
      setIsLoading(true);
      setError(null);
      setStrip(null);
      if (!photo.length) return setIsLoading(false);

      await new Promise(r => setTimeout(r, 250));
      try {
        if (!stripRef.current) throw new Error('View ref is null');

        const fileUri = await captureRef(stripRef.current, {
          format: 'png',
          quality: 1,
          width: canvasW,
          height: canvasH,
          result: 'tmpfile',
        });

        const base64 = await captureRef(stripRef.current, {
          format: 'png',
          quality: 1,
          width: canvasW,
          height: canvasH,
          result: 'base64',
        });

        setStrip({ fileUri, base64 });

        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') await MediaLibrary.saveToLibraryAsync(fileUri);
      } catch (e: any) {
        setError(e?.message || 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    makeStrip();
  }, [photo]);

  const handleExportPdf = async () => {
    if (!strip) return setError('No image available to export.');
    setIsExportingPdf(true);
    try {
      const html = `<!DOCTYPE html><html><body style="margin:0">
        <div style="display:flex">
          <img src="data:image/png;base64,${strip.base64}" style="width:25%;height:auto"/>
          <img src="data:image/png;base64,${strip.base64}" style="width:25%;height:auto"/>
        </div>
      </body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Print.printAsync({ uri });
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message || 'Unknown error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleShareImage = async () => {
    if (!strip) return;
    setIsSharingImage(true);
    try {
      const ok = await Sharing.isAvailableAsync();
      if (!ok) return Alert.alert('Not Available', 'Sharing not supported.');
      await Sharing.shareAsync(strip.fileUri, { mimeType: 'image/png', UTI: 'public.png' });
    } catch (e: any) {
      Alert.alert('Share Failed', e?.message || 'Unknown error');
    } finally {
      setIsSharingImage(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        ref={stripRef}
        collapsable={false}
        style={[
          styles.hiddenStrip,
          { width: canvasW, height: canvasH, padding: margin, backgroundColor: 'white' },
        ]}
      >
        {photo.map((p, i) =>
          p.base64 ? (
            <Image
              key={i}
              style={{ width: photoW, height: photoH, marginBottom: i < photo.length - 1 ? pad : 0 }}
              source={{ uri: 'data:image/jpg;base64,' + p.base64 }}
            />
          ) : null
        )}
        <Image source={require('../assets/images/LogoWhite.png')} style={styles.logo} />
      </View>

      <View style={styles.stripContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="white" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : strip ? (
          <Image
            style={{
              width: screenWidth * 0.8,
              height: (screenWidth * 0.3) * (canvasH / canvasW),
              resizeMode: 'contain',
            }}
            source={{ uri: `data:image/png;base64,${strip.base64}` }}
          />
        ) : (
          <View style={styles.noPhotoPlaceholder}>
            <Fontisto name="camera" size={40} color="black" />
            <Text style={styles.noPhotoText}>No photos to display.</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleRetakePhoto} disabled={isLoading || isExportingPdf || isSharingImage}>
          <Fontisto name="camera" size={40} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, (!strip || isLoading || isExportingPdf || isSharingImage) && styles.disabled]}
          onPress={handleExportPdf}
          disabled={!strip || isLoading || isExportingPdf || isSharingImage}
        >
          {isExportingPdf ? <ActivityIndicator size="small" color="black" /> : <Fontisto name="print" size={40} color="black" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, (!strip || isLoading || isExportingPdf || isSharingImage) && styles.disabled]}
          onPress={handleShareImage}
          disabled={!strip || isLoading || isExportingPdf || isSharingImage}
        >
          {isSharingImage ? <ActivityIndicator size="small" color="black" /> : <Fontisto name="share" size={40} color="black" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' },
  hiddenStrip: { position: 'absolute', top: -9999, left: -9999, alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden' },
  stripContainer: { flex: 1, width: '100%', backgroundColor: 'black', paddingVertical: 10, marginTop: 75, justifyContent: 'center', alignItems: 'center' },
  noPhotoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noPhotoText: { marginTop: 10, color: 'gray', fontSize: 16 },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center', margin: 10 },
  buttonRow: { marginBottom: 150, flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 50 },
  button: { backgroundColor: 'white', borderRadius: 50, padding: 20, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  logo: { position: 'absolute', width: 150, height: 75, bottom: 0, resizeMode: 'contain' },
});

export default PhotoPreviewSection;