package com.example.billing.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.billing.entity.Bill;
import com.example.billing.repository.BillRepository;

@Service
public class BillingService {

    private final BillRepository billRepository;

    public BillingService(BillRepository billRepository) {
        this.billRepository = billRepository;
    }

    public Bill createBill(Bill bill) {
        bill.setPaymentStatus("PENDING");
        return billRepository.save(bill);
    }

    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }

    public Bill getBillById(Long id) {
        return billRepository.findById(id)
                .orElseThrow(() ->
                    new RuntimeException("Bill not found"));
    }

    public List<Bill> getBillsByUsername(String username) {
        return billRepository.findByUsername(username);
    }
}