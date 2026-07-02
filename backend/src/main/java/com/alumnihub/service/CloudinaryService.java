package com.alumnihub.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Uploads file to Cloudinary under the specified folder.
     */
    public Map uploadFile(MultipartFile file, String folder) throws IOException {
        return cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", folder,
                "resource_type", "auto"
        ));
    }

    /**
     * Deletes a resource from Cloudinary by public ID.
     */
    public Map deleteFile(String publicId) throws IOException {
        return cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }

    /**
     * Helper to extract Cloudinary public ID from a secure URL.
     * Example URL: https://res.cloudinary.com/cloudname/image/upload/v1625097600/alumni-hub/profile/user-123.jpg
     */
    public String extractPublicId(String url) {
        if (url == null || !url.contains("cloudinary.com")) {
            return null;
        }
        try {
            int uploadIdx = url.indexOf("/upload/");
            if (uploadIdx == -1) return null;
            String remaining = url.substring(uploadIdx + 8); // Remove "/upload/"

            // Skip version prefix if present (e.g., v1625097600/)
            if (remaining.startsWith("v")) {
                int firstSlash = remaining.indexOf("/");
                if (firstSlash != -1) {
                    remaining = remaining.substring(firstSlash + 1);
                }
            }

            // Strip the file extension at the end
            int lastDot = remaining.lastIndexOf(".");
            if (lastDot != -1) {
                remaining = remaining.substring(0, lastDot);
            }
            return remaining;
        } catch (Exception e) {
            log.error("Failed to parse public ID from URL: {}", url, e);
            return null;
        }
    }
}
