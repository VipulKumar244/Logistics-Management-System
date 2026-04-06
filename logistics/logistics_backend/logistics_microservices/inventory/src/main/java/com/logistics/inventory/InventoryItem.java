package com.logistics.inventory; 

import jakarta.persistence.*;

@Entity
@Table(name = "inventory")
public class InventoryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String brand;
    private String variant;
    private String category;
    
    @Column(unique = true, nullable = false)
    private String sku;

    private Integer stock;
    private Double price;
    private String warehouse;
    private String location;

    

    public InventoryItem() {} 

    public InventoryItem(Long id, String name, String brand, String variant, String category, String sku, Integer stock, Double price, String warehouse, String location) {
        this.id = id;
        this.name = name;
        this.brand = brand;
        this.variant = variant;
        this.category = category;
        this.sku = sku;
        this.stock = stock;
        this.price = price;
        this.warehouse = warehouse;
        this.location = location;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getVariant() { return variant; }
    public void setVariant(String variant) { this.variant = variant; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getWarehouse() { return warehouse; }
    public void setWarehouse(String warehouse) { this.warehouse = warehouse; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}