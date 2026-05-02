# Security Specification for Chill Tea

## Data Invariants
1. A Product must have a positive name, price, and stock.
2. An Order must have items, a valid total (sum of item prices * quantities), and customer contact info.
3. Only Admins can create/update/delete products.
4. Customers can only read active products.
5. Customers can only create their own orders and read their own history.
6. Admins can update order status but not individual item details once placed (except for error correction).

## The Dirty Dozen Payloads
1. **Malicious Product Create**: User tries to create a product without being an admin.
2. **Price Manipulation**: Customer tries to update a product's price.
3. **Invalid Stock Update**: Admin tries to set stock to a negative number.
4. **Order Spoofing**: User A tries to create an order for User B by setting `customerId` to User B's UID.
5. **Role Escalation**: New user tries to set their role to 'admin' during signup.
6. **Orphaned Order**: Creating an order for a product ID that doesn't exist.
7. **Negative Total**: Creating an order with a total of -100.
8. **PII Exposure**: User A tries to read User B's order (get request).
9. **Bulk Scrape**: Unauthorized user tries to list all users.
10. **Terminal State Break**: Customer tries to cancel an order that is already 'completed'.
11. **ID Poisoning**: Creating a product with a 2KB string as ID.
12. **Shadow Field**: Adding `isVerified: true` to a user document update.

## Test Strategy (Conceptual)
All test cases for the above payloads should return `PERMISSION_DENIED`.

```typescript
// firestore.rules.test.ts (Excerpt)
// test('Malicious Product Create', async () => { ... expect(denied) ... });
```
