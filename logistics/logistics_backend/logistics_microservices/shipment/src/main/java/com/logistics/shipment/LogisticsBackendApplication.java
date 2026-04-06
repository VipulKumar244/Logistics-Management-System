package com.example.demo;

import com.example.demo.entity.Shipment;
import com.example.demo.repository.ShipmentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@SpringBootApplication(exclude = { SecurityAutoConfiguration.class })
public class LogisticsBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(LogisticsBackendApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(ShipmentRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                // Load initial sample data only once on an empty database
                Shipment s1 = new Shipment();
                s1.setShipmentCode("SHP-1001");
                s1.setOrigin("Chennai");
                s1.setDestination("Bangalore");
                s1.setSourceLat(13.0827); s1.setSourceLng(80.2707); // Chennai
                s1.setDestLat(12.9716); s1.setDestLng(77.5946);   // Bangalore
                s1.setStatus("IN_TRANSIT");
                s1.setProgress(65);
                s1.setDriverId(101);

                Shipment s2 = new Shipment();
                s2.setShipmentCode("SHP-1002");
                s2.setOrigin("Mumbai");
                s2.setDestination("Hyderabad");
                s2.setSourceLat(19.0760); s2.setSourceLng(72.8777); // Mumbai
                s2.setDestLat(17.3850); s2.setDestLng(78.4867);   // Hyderabad
                s2.setStatus("DELIVERED");
                s2.setProgress(100);
                s2.setDriverId(102);

                Shipment s3 = new Shipment();
                s3.setShipmentCode("SHP-1003");
                s3.setOrigin("Mumbai");
                s3.setDestination("Pune");
                s3.setSourceLat(19.0760); s3.setSourceLng(72.8777); // Mumbai
                s3.setDestLat(18.5204); s3.setDestLng(73.8567);   // Pune
                s3.setStatus("CANCELLED");
                s3.setProgress(0);
                s3.setDriverId(103);

                repository.saveAll(List.of(s1, s2, s3));
                System.out.println(">>> Database Seeded with Dynamic Coordinates");
            }
        };
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:5173")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH");
            }
        };
    }
}