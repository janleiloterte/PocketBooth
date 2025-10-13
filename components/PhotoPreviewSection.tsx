import { Fontisto } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  SafeAreaView,
  Image,
  StyleSheet,
  View,
  ActivityIndicator,
  Dimensions,
  Text,
  Alert,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system'; // Corrected typo here
import * as Sharing from 'expo-sharing';

const { width: screenWidth } = Dimensions.get('window');

const PhotoPreviewSection = ({
  photo,
  handleRetakePhoto,
}: {
  photo: CameraCapturedPicture[];
  handleRetakePhoto: () => void;
}) => {
  const [combinedPhotoUri, setCombinedPhotoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stripViewRef = useRef(null);

  const photoWidth = 200;
  const photoHeight = 125;
  const photoPadding = 10;
  const stripCanvasMargin = 20;
  const stripBackgroundColor = 'white';

  const totalPhotosHeight = photo.length * photoHeight;
  const totalPaddingHeight = (photo.length - 1) * photoPadding;
  const stripContentHeight = totalPhotosHeight + totalPaddingHeight;
  const stripContentWidth = photoWidth;
  const finalStripCanvasWidth = stripContentWidth + 2 * stripCanvasMargin;
  const aspectRatio = 637.5 / 1650;
  const finalStripCanvasHeight = finalStripCanvasWidth / aspectRatio;

  useEffect(() => {
    const generatePhotoboothStrip = async () => {
      setIsLoading(true);
      setError(null);
      setCombinedPhotoUri(null);

      if (photo.length === 0) {
        setIsLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        if (!stripViewRef.current) throw new Error("View reference is null.");

        const uri = await captureRef(stripViewRef, {
          format: 'png',
          quality: 1,
          height: finalStripCanvasHeight,
          width: finalStripCanvasWidth,
        });

        setCombinedPhotoUri(uri);

        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
        }
      } catch (e: any) {
        console.error('Strip generation failed:', e);
        setError(`Error: ${e.message || 'Unknown'}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (photo.length > 0) generatePhotoboothStrip();
    else setIsLoading(false);
  }, [photo]);

  const handleExportPdf = async () => {
    if (!combinedPhotoUri) return setError("No image available to export.");

    setIsExportingPdf(true);
    setError(null);

    try {
      const base64Image = await FileSystem.readAsStringAsync(combinedPhotoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const html = `
        <!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;">
    <div style="display:flex;flex-direction:row;">
      <img src="data:image/png;base64,${base64Image}" style="width:25%;height:auto;" />
      <img src="data:image/png;base64,${base64Image}" style="width:25%;height:auto;" />
    </div>
  </body>
</html>`;

      const { uri: pdfUri } = await Print.printToFileAsync({ html });
      await Print.printAsync({ uri: pdfUri });
    } catch (e: any) {
      console.error('PDF export error:', e);
      Alert.alert("Export Failed", e.message || 'Unknown error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleShareImage = async () => {
    if (!combinedPhotoUri) {
      setError("No image to share.");
      Alert.alert("Share Failed", "No image available.");
      return;
    }

    setIsSharingImage(true);
    setError(null);

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return Alert.alert("Not Available", "Sharing not supported.");

      await Sharing.shareAsync(combinedPhotoUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your Photobooth Strip',
        UTI: 'public.png',
      });
    } catch (e: any) {
      console.error('Share error:', e);
      Alert.alert("Share Failed", e.message || 'Unknown error');
    } finally {
      setIsSharingImage(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        ref={stripViewRef}
        style={[
          styles.hiddenStrip,
          {
            width: finalStripCanvasWidth,
            height: finalStripCanvasHeight,
            padding: stripCanvasMargin,
            backgroundColor: stripBackgroundColor,
          },
        ]}
      >
        {photo.map((pic, i) => (
          pic.base64 ? (
            <Image
              key={i}
              style={{
                width: photoWidth,
                height: photoHeight,
                marginBottom: i < photo.length - 1 ? photoPadding : 0,
              }}
              source={{ uri: 'data:image/jpg;base64,' + pic.base64 }}
            />
          ) : null
        ))}
        {/* Logo with absolute positioning */}
        <Image
          source={require('../assets/images/loveislandlogo.png')}
          style={styles.logoStyle} // Apply the new style here
        />
      </View>

      <View style={styles.stripContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="white" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : combinedPhotoUri ? (
          <Image
            style={{
              width: screenWidth * 0.8,
              height: (screenWidth * 0.3) * (finalStripCanvasHeight / finalStripCanvasWidth),
              resizeMode: 'contain',
            }}
            source={{ uri: combinedPhotoUri }}
          />
        ) : (
          <View style={styles.noPhotoPlaceholder}>
            <Fontisto name="camera" size={100} color="gray" />
            <Text style={styles.noPhotoText}>No photos to display.</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleRetakePhoto}
          disabled={isLoading || isExportingPdf || isSharingImage}
        >
          <Fontisto name="camera" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.exportButton, (!combinedPhotoUri || isLoading || isExportingPdf || isSharingImage) && styles.disabledButton]}
          onPress={handleExportPdf}
          disabled={!combinedPhotoUri || isLoading || isExportingPdf || isSharingImage}
        >
          {isExportingPdf ? <ActivityIndicator size="small" color="black" /> : <Fontisto name="print" size={24} color="white" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.shareButton, (!combinedPhotoUri || isLoading || isExportingPdf || isSharingImage) && styles.disabledButton]}
          onPress={handleShareImage}
          disabled={!combinedPhotoUri || isLoading || isExportingPdf || isSharingImage}
        >
          {isSharingImage ? <ActivityIndicator size="small" color="white" /> : <Fontisto name="share" size={24} color="white" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenStrip: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  stripContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'darkgray',
    borderRadius: 15,
    paddingVertical: 20,
    marginTop: 20,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  noPhotoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    marginTop: 10,
    color: 'gray',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    margin: 10,
  },
  buttonContainer: {
    marginBottom: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 20,
  },
  button: {
    backgroundColor: 'gray',
    borderRadius: 25,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
  },
  shareButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
  },
  disabledButton: {
    opacity: 0.5,
  },
  logoStyle: {
    position: 'absolute', // This is key for absolute positioning
    width: 150, // Adjust as needed
    height: 75,  // Adjust as needed (maintain aspect ratio if desired)
    bottom: 0,  // Example: 20 pixels from the bottom of the strip
    marginHorizontal: 'auto',
    resizeMode: 'contain',
  },
});

export default PhotoPreviewSection;