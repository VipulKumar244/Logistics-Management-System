package com.example.demo.repository;

import com.example.demo.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    // --- NEW METHODS TO FIX CONTROLLER ERRORS ---
    
    /**
     * Fixes: countByStatus(String) is undefined
     * Returns the count of shipments matching a specific status (e.g., PENDING)
     */
    long countByStatus(String status);

    /**
     * Fixes: findByStatus(String)
     * Used for the /api/shipments/pending endpoint
     */
    List<Shipment> findByStatus(String status);

    // --- EXISTING METHODS ---

    Optional<Shipment> findByShipmentCode(String shipmentCode);

    List<Shipment> findByDriverId(Integer driverId);

    List<Shipment> findByOriginAndDestination(String origin, String destination);

    List<Shipment> findByOrigin(String origin);

    List<Shipment> findByDestination(String destination);

    List<Shipment> findByProgressGreaterThanEqual(Integer progress);

    @Query("SELECT s FROM Shipment s WHERE s.status IN ('PENDING', 'IN_TRANSIT') ORDER BY s.createdAt DESC")
    List<Shipment> findActiveShipments();

    @Query("SELECT s FROM Shipment s WHERE s.driverId = :driverId AND s.status = :status")
    List<Shipment> findByDriverIdAndStatus(@Param("driverId") Integer driverId, @Param("status") String status);

    boolean existsByShipmentCode(String shipmentCode);

    // Note: 'INTERVAL 7 DAY' is H2/MySQL compatible. 
    @Query(value = "SELECT * FROM shipments WHERE created_at >= CURRENT_DATE - INTERVAL 7 DAY ORDER BY created_at DESC", nativeQuery = true)
    List<Shipment> findRecentShipments();
}