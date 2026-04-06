package com.logistics.inventory; 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {
    // Custom query to help with your frontend category filters
    List<InventoryItem> findByCategoryIgnoreCase(String category);
    
    // Custom query for your search bar
    List<InventoryItem> findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(String name, String sku);
}