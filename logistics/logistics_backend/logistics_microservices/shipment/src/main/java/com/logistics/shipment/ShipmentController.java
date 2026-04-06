package com.example.demo.controller;

import com.example.demo.entity.Shipment;
import com.example.demo.repository.ShipmentRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/shipments")
@CrossOrigin(origins = "http://localhost:5173") 
public class ShipmentController {

    private final ShipmentRepository repo;

    public ShipmentController(ShipmentRepository repo) {
        this.repo = repo;
    }

    // ✅ GET ALL
    @GetMapping
    public ResponseEntity<List<Shipment>> getAll() {
        return ResponseEntity.ok(repo.findAll());
    }

    // ✅ POST CREATE - Handles dynamic coordinates from the frontend form
    @PostMapping
    public ResponseEntity<Shipment> create(@Valid @RequestBody Shipment shipment) {
        // Set defaults if missing
        if (shipment.getStatus() == null) shipment.setStatus("PENDING");
        if (shipment.getProgress() == null) shipment.setProgress(0);
        
        // Coordinates (sourceLat, sourceLng, etc.) are automatically mapped 
        // from the RequestBody to the Entity by Spring.
        
        Shipment saved = repo.save(shipment);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ✅ PUT UPDATE - Syncs all fields including coordinates
    @PutMapping("/{id}")
    public ResponseEntity<Shipment> update(@PathVariable Long id, @Valid @RequestBody Shipment update) {
        return repo.findById(id)
                .map(shipment -> {
                    shipment.setShipmentCode(update.getShipmentCode());
                    shipment.setOrigin(update.getOrigin());
                    shipment.setDestination(update.getDestination());
                    
                    // ✅ CRITICAL: Sync coordinates so the map updates on edit
                    shipment.setSourceLat(update.getSourceLat());
                    shipment.setSourceLng(update.getSourceLng());
                    shipment.setDestLat(update.getDestLat());
                    shipment.setDestLng(update.getDestLng());
                    
                    shipment.setDriverId(update.getDriverId());
                    shipment.setStatus(update.getStatus());
                    shipment.setProgress(update.getProgress());
                    shipment.setUpdatedAt(LocalDateTime.now());
                    
                    return ResponseEntity.ok(repo.save(shipment));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ PATCH PROGRESS - Auto-updates Status based on movement
    @PatchMapping("/{id}/progress")
    public ResponseEntity<Shipment> updateProgress(@PathVariable Long id, @RequestBody ProgressUpdate update) {
        return repo.findById(id)
                .map(shipment -> {
                    shipment.setProgress(update.progress()); 
                    
                    if (update.progress() >= 100) {
                        shipment.setStatus("DELIVERED");
                    } else if (update.progress() > 0) {
                        shipment.setStatus("IN_TRANSIT");
                    }
                    
                    shipment.setUpdatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(repo.save(shipment));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ STATS - For dashboard cards
    @GetMapping("/stats")
    public ResponseEntity<ShipmentStats> getStats() {
        ShipmentStats stats = new ShipmentStats(
            repo.count(),
            repo.countByStatus("PENDING"),
            repo.countByStatus("IN_TRANSIT"),
            repo.countByStatus("DELIVERED")
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Shipment>> getPending() {
        return ResponseEntity.ok(repo.findByStatus("PENDING"));
    }
}

// --- DTOs ---
record ShipmentStats(Long total, Long pending, Long inTransit, Long delivered) {}
record ProgressUpdate(Integer progress) {}