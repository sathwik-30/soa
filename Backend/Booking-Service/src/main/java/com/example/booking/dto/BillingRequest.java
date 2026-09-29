package com.example.booking.dto;

public class BillingRequest {

    private Long bookingId;
    private String username;
    private double amount;

    public BillingRequest() {
    }

    public BillingRequest(
            Long bookingId,
            String username,
            double amount) {

        this.bookingId = bookingId;
        this.username = username;
        this.amount = amount;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }
}