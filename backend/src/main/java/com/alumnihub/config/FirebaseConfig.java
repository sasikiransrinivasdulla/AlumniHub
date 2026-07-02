package com.alumnihub.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.project-id}")
    private String projectId;

    @Value("${firebase.client-email}")
    private String clientEmail;

    @Value("${firebase.private-key}")
    private String privateKey;

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            // Defensively handle private keys with raw newline strings (escaped \n)
            String formattedKey = privateKey.replace("\\n", "\n");

            // GoogleCredentials requires 'client_id', 'client_email', 'private_key', and 'private_key_id'
            Map<String, Object> serviceAccountMap = Map.of(
                "type", "service_account",
                "project_id", projectId,
                "private_key_id", "dummy-private-key-id",
                "private_key", formattedKey,
                "client_email", clientEmail,
                "client_id", "dummy-client-id"
            );

            String serviceAccountJson = new ObjectMapper().writeValueAsString(serviceAccountMap);

            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(
                    new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8))
                ))
                .build();

            return FirebaseApp.initializeApp(options);
        }
        return FirebaseApp.getInstance();
    }
}
