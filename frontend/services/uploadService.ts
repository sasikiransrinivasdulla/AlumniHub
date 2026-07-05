import { getAuthToken, UserProfile, setAuthUser } from "./authService";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080")
  .trim()
  .replace(/^["']|["']$/g, "")
  .trim();

export interface UploadProgressCallback {
  (percent: number): void;
}

export function uploadProfileImage(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<UserProfile> {
  return new Promise((resolve, reject) => {
    const token = getAuthToken();
    if (!token) {
      return reject(new Error("No authentication token found."));
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/upload/profile-image`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const user: UserProfile = JSON.parse(xhr.responseText);
          setAuthUser(user);
          resolve(user);
        } catch (e) {
          reject(new Error("Invalid response format."));
        }
      } else {
        reject(new Error(xhr.responseText || `Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during file upload."));
    };

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export async function deleteProfileImage(): Promise<UserProfile> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token found.");
  }

  const response = await fetch(`${API_URL}/api/upload/profile-image`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to remove profile picture.");
  }

  const updatedUser: UserProfile = await response.json();
  setAuthUser(updatedUser);
  return updatedUser;
}

export function uploadPostImage(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  return new Promise((resolve, reject) => {
    const token = getAuthToken();
    if (!token) {
      return reject(new Error("No authentication token found."));
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/upload/post-image`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res.url);
        } catch (e) {
          reject(new Error("Invalid response format."));
        }
      } else {
        reject(new Error(xhr.responseText || `Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during file upload."));
    };

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export function uploadPostVideo(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  return new Promise((resolve, reject) => {
    const token = getAuthToken();
    if (!token) {
      return reject(new Error("No authentication token found."));
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/upload/post-video`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res.url);
        } catch (e) {
          reject(new Error("Invalid response format."));
        }
      } else {
        reject(new Error(xhr.responseText || `Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during file upload."));
    };

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}
