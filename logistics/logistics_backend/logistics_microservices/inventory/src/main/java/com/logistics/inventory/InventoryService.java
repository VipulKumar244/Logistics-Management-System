package com.logistics.inventory; 

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository repository;

    public List<InventoryItem> getAllItems() {
        return repository.findAll();
    }

    public InventoryItem saveItem(InventoryItem item) {
        return repository.save(item);
    }

    public InventoryItem updateItem(Long id, InventoryItem details) {
        InventoryItem item = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        
        item.setName(details.getName());
        item.setBrand(details.getBrand());
        item.setVariant(details.getVariant());
        item.setCategory(details.getCategory());
        item.setStock(details.getStock());
        item.setPrice(details.getPrice());
        item.setWarehouse(details.getWarehouse());
        item.setLocation(details.getLocation());
        
        return repository.save(item);
    }

    public void deleteItem(Long id) {
        repository.deleteById(id);
    }
}