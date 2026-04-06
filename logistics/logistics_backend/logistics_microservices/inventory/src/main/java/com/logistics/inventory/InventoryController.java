package com.logistics.inventory;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:5173")
public class InventoryController {
    @Autowired
    private InventoryService service;

    @Autowired
    private InventoryRepository inventoryRepository;

    
    public List<InventoryItem> getAllItems() {
        return inventoryRepository.findAll();
    }

   
    public InventoryItem saveItem(InventoryItem item) {
        return inventoryRepository.save(item);
    }

   
    public InventoryItem updateItem(Long id, InventoryItem details) {
        InventoryItem existingItem = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found with id: " + id));
        
       
        existingItem.setName(details.getName());
        existingItem.setBrand(details.getBrand());
        existingItem.setVariant(details.getVariant());
        existingItem.setCategory(details.getCategory());
        existingItem.setStock(details.getStock());
        existingItem.setSku(details.getSku());
        existingItem.setWarehouse(details.getWarehouse());
        existingItem.setLocation(details.getLocation());
        
        return inventoryRepository.save(existingItem);
    }

    
    public void deleteItem(Long id) {
        inventoryRepository.deleteById(id);
    }
}