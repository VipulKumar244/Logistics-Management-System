package com.logistics.inventory;

import com.logistics.inventory.InventoryItem;
import com.logistics.inventory.InventoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@SpringBootApplication(exclude = { SecurityAutoConfiguration.class })
public class InventoryApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventoryApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(InventoryRepository repository) {
        return args -> {
           
            InventoryItem item1 = new InventoryItem();
            item1.setName("Logistics Tracker v2");
            item1.setBrand("SRM-Tech");
            item1.setVariant("Pro-GPS");
            item1.setCategory("Electronics");
            item1.setSku("SRM-EL-001");
            item1.setStock(150);
            item1.setPrice(2500.00);
            item1.setWarehouse("Chennai-North");
            item1.setLocation("Rack-A1");

        
            InventoryItem item2 = new InventoryItem();
            item2.setName("Heavy Duty Pallets");
            item2.setBrand("Generic");
            item2.setVariant("Wooden-Large");
            item2.setCategory("Storage");
            item2.setSku("STR-PL-505");
            item2.setStock(40);
            item2.setPrice(1200.00);
            item2.setWarehouse("Bangalore-Main");
            item2.setLocation("Zone-3");


            InventoryItem item3 = new InventoryItem();
            item3.setName("High-Vis Vests");
            item3.setBrand("SafeGuard");
            item3.setVariant("Neon-Orange");
            item3.setCategory("Safety");
            item3.setSku("SAF-VST-10");
            item3.setStock(500);
            item3.setPrice(350.00);
            item3.setWarehouse("Chennai-North");
            item3.setLocation("Rack-S9");

            repository.saveAll(List.of(item1, item2, item3));
            System.out.println(">>> Inventory Database Seeded Successfully!");
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