import { collection, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";

/** 문서를 추가하고 생성된 문서 id 를 돌려준다. */
export const saveToFirestore = async (
  collectionName: string,
  data: Record<string, unknown>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw new Error("Failed to save data to Firestore");
  }
};
