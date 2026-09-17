import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export interface PickedPhoto {
  uri: string;
  name: string;
  mimeType: string;
}

export async function pickProofPhoto(): Promise<PickedPhoto | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Photo permission is required to attach proof");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.7,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? `proof-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
}

export async function uploadProofPhoto(
  taskId: string,
  photo: PickedPhoto
): Promise<string> {
  const response = await fetch(photo.uri);
  const blob = await response.blob();
  const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageRef = ref(storage, `taskProof/${taskId}/${Date.now()}-${safeName}`);
  await uploadBytes(storageRef, blob, { contentType: photo.mimeType });
  return getDownloadURL(storageRef);
}
