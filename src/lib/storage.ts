import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
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

export interface PickedDoc {
  uri: string;
  name: string;
  mimeType: string;
}

export async function pickProofDocument(): Promise<PickedDoc | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name ?? `document-${Date.now()}.pdf`,
    mimeType: asset.mimeType ?? "application/pdf",
  };
}

export async function uploadProofDocument(
  taskId: string,
  doc: PickedDoc
): Promise<string> {
  const response = await fetch(doc.uri);
  const blob = await response.blob();
  const safeName = doc.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageRef = ref(storage, `taskProof/${taskId}/${Date.now()}-${safeName}`);
  await uploadBytes(storageRef, blob, { contentType: doc.mimeType });
  return getDownloadURL(storageRef);
}

export async function uploadAvatar(uid: string, photo: PickedPhoto): Promise<string> {
  const response = await fetch(photo.uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `avatars/${uid}/photo.jpg`);
  await uploadBytes(storageRef, blob, { contentType: photo.mimeType });
  return getDownloadURL(storageRef);
}

export async function pickProofPhotoBase64(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Photo permission is required to attach proof");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const manipulated = await ImageManipulator.manipulate(
    result.assets[0].uri
  )
    .resize({ width: 800 })
    .renderAsync();
  const saved = await manipulated.saveAsync({
    compress: 0.5,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (!saved.base64) throw new Error("Could not process photo");
  return `data:image/jpeg;base64,${saved.base64}`;
}
