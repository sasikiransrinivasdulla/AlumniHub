package com.alumnihub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
@EnableAsync
public class AlumniHubApplication {

    static {
        loadEnv();
    }

    public static void main(String[] args) {
        SpringApplication.run(AlumniHubApplication.class, args);
    }

    private static void loadEnv() {
        // Look for .env in the current working directory, or one directory up
        File envFile = new File(".env");
        if (!envFile.exists()) {
            envFile = new File("../.env");
        }

        if (envFile.exists()) {
            try {
                List<String> lines = Files.readAllLines(envFile.toPath());
                for (String line : lines) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) {
                        continue;
                    }
                    int eqIdx = line.indexOf('=');
                    if (eqIdx > 0) {
                        String key = line.substring(0, eqIdx).trim();
                        String value = line.substring(eqIdx + 1).trim();
                        
                        // Remove surrounding quotes if present
                        if (value.startsWith("\"") && value.endsWith("\"")) {
                            value = value.substring(1, value.length() - 1);
                        } else if (value.startsWith("'") && value.endsWith("'")) {
                            value = value.substring(1, value.length() - 1);
                        }

                        // Load into system properties if not already set in OS environment
                        if (System.getenv(key) == null && System.getProperty(key) == null) {
                            System.setProperty(key, value);
                        }
                    }
                }
            } catch (IOException e) {
                System.err.println("Could not load .env file: " + e.getMessage());
            }
        }

        // Dynamically parse DATABASE_URL to configure JDBC settings if present
        String dbUrl = System.getProperty("DATABASE_URL");
        if (dbUrl == null) {
            dbUrl = System.getenv("DATABASE_URL");
        }

        if (dbUrl != null && dbUrl.startsWith("postgresql://")) {
            try {
                // Format: postgresql://username:password@host:port/database?options
                String cleanUrl = dbUrl.substring("postgresql://".length());
                int atIdx = cleanUrl.indexOf('@');
                if (atIdx > 0) {
                    String credentials = cleanUrl.substring(0, atIdx);
                    String hostAndDb = cleanUrl.substring(atIdx + 1);

                    int colonIdx = credentials.indexOf(':');
                    String username = colonIdx > 0 ? credentials.substring(0, colonIdx) : credentials;
                    String password = colonIdx > 0 ? credentials.substring(colonIdx + 1) : "";

                    String jdbcUrl = "jdbc:postgresql://" + hostAndDb;

                    System.setProperty("SPRING_DATASOURCE_URL", jdbcUrl);
                    System.setProperty("SPRING_DATASOURCE_USERNAME", username);
                    System.setProperty("SPRING_DATASOURCE_PASSWORD", password);
                }
            } catch (Exception e) {
                System.err.println("Failed to parse DATABASE_URL: " + e.getMessage());
            }
        }
    }
}
