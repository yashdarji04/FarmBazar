# FarmDirect Marketplace - Admin Data Dictionary

This document serves as the complete Data Dictionary for the **FarmDirect Marketplace** system, covering all database models, collections, fields, data types, constraints, and relationships accessible to and managed by the **Admin**.

---

## 1. Database Overview

* **Database Engine**: MongoDB (NoSQL) via Mongoose ORM
* **Database Name**: `farmdirect`
* **Default Host / Port**: `mongodb://localhost:27017/farmdirect`
* **Admin Role**: Admin users are stored within the `users` collection having the field `role: "admin"`.
* **Default Admin Account**:
  * **Email**: `admin@farmdirect.com`
  * **Default Password**: `Admin@123`
  * **Role**: `admin`

---

## 2. Entity Relationship Summary

```
                      +-------------------+
                      |      User         |
                      | (Admin/Farmer/    |
                      |   Customer)       |
                      +---------+---------+
                                |
               +----------------+----------------+
               | 1:1                             | 1:N
               v                                 v
      +-----------------+               +-----------------+
      |  FarmerProfile  |               |      Order      |
      +--------+--------+               +--------+--------+
               |                                 |
               | 1:N                             | 1:N
               v                                 v
      +-----------------+               +-----------------+
      |     Product     |               |     Payment     |
      +--------+--------+               +-----------------+
               |
               | 1:N
               v
      +-----------------+
      |     Review      |
      +-----------------+
```

---

## 3. Detailed Data Dictionary by Collection

---

### 3.1 Collection: `users`
**Description**: Stores credential and identity details for all application users (Administrators, Farmers, Customers).

| Column / Field | Data Type | Key / Ref | Nullable | Default Value | Constraints & Validation | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | No | Auto (UUID) | Auto-generated MongoDB ObjectId | Unique system identifier for the user |
| `name` | String | - | No | None | Required, Trimmed | Full name of the user |
| `email` | String | Unique Index | No | None | Valid email regex pattern, Unique | Login email address |
| `password` | String | - | No | None | Min length 6, Hashed (Bcrypt), `select: false` | Encrypted user password |
| `phone` | String | - | No | None | Required | Contact phone number |
| `role` | String | - | No | `'customer'` | Enum: `['customer', 'farmer', 'admin']` | Authorization access role |
| `isVerified` | Boolean | - | No | `false` | Boolean flag | Whether user email/phone is verified |
| `isActive` | Boolean | - | No | `true` | Boolean flag | Admin status toggle for active/disabled |
| `profileImage` | String | - | Yes | `'default.jpg'` | URL or file path | User profile avatar image |
| `address` | String | - | Yes | `null` | Free text | Street address |
| `city` | String | - | Yes | `null` | Free text | User city (e.g. Ahmedabad) |
| `state` | String | - | Yes | `null` | Free text | User state |
| `pincode` | String | - | Yes | `null` | Free text / postal code | Postal PIN code |
| `createdAt` | Date | - | No | Auto (now) | ISODate | Timestamp when the user registered |
| `updatedAt` | Date | - | No | Auto (now) | ISODate | Timestamp of the last profile modification |

---

### 3.2 Collection: `farmerprofiles`
**Description**: Additional farm details, verification documents, and sales aggregation for users with the `farmer` role. Reviewed and approved by Admin.

| Column / Field | Data Type | Key / Ref | Nullable | Default Value | Constraints & Validation | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | No | Auto (UUID) | Auto-generated | Unique farmer profile identifier |
| `userId` | ObjectId | Foreign Key | No | None | Ref: `User._id` | Associated user account |
| `farmName` | String | - | No | None | Required | Business/farm name |
| `ownerName` | String | - | No | None | Required | Farm owner's full legal name |
| `farmAddress` | String | - | Yes | `''` | Free text | Physical address of the farm |
| `city` | String | - | Yes | `''` | Free text | Farm city location |
| `state` | String | - | Yes | `''` | Free text | Farm state location |
| `pincode` | String | - | Yes | `''` | Free text | Farm PIN code |
| `farmDescription` | String | - | Yes | `null` | Free text | Narrative of farming techniques & history |
| `farmImage` | String | - | Yes | `null` | URL / path | Photo/banner of the farm |
| `governmentId` | String | - | Yes | `null` | URL / path | Uploaded certification / license document |
| `verificationStatus` | String | - | No | `'pending'` | Enum: `['pending', 'approved', 'rejected']` | **Admin approval status for onboarding** |
| `rating` | Number | - | No | `0` | Range: 0.0 - 5.0 | Average rating computed from reviews |
| `totalSales` | Number | - | No | `0` | Min: 0 | Total product quantity units sold |
| `totalOrders` | Number | - | No | `0` | Min: 0 | Total completed orders |
| `totalEarnings` | Number | - | No | `0` | Min: 0 | Total gross earnings in INR (₹) |
| `createdAt` | Date | - | No | Auto (now) | ISODate | Profile creation timestamp |
| `updatedAt` | Date | - | No | Auto (now) | ISODate | Profile last updated timestamp |

---

### 3.3 Collection: `products`
**Description**: Fresh produce and agricultural products listed on the platform.

| Column / Field | Data Type | Key / Ref | Nullable | Default Value | Constraints & Validation | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | No | Auto (UUID) | Auto-generated | Unique product ID |
| `farmerId` | ObjectId | Foreign Key | No | None | Ref: `FarmerProfile._id` | Selling farmer's profile reference |
| `name` | String | Text Index | No | None | Required, searchable | Commercial product name |
| `category` | String | Text Index | No | None | Required, searchable | Produce category (e.g., Vegetables, Fruits) |
| `description` | String | - | No | None | Required | Detailed product overview |
| `price` | Number | - | No | None | Required, Min: 0 | Price per unit in INR (₹) |
| `quantity` | Number | - | No | None | Required, Min: 0 | Available stock inventory |
| `unit` | String | - | No | None | Enum: `['kg', 'gram', 'litre', 'piece', 'dozen']` | Selling measurement metric |
| `images` | Array[String] | - | Yes | `[]` | List of URLs | Product photo gallery |
| `harvestDate` | Date | - | Yes | `null` | ISODate | Date the crop was harvested |
| `expiryDate` | Date | - | Yes | `null` | ISODate | Best before expiration date |
| `isOrganic` | Boolean | - | No | `false` | Boolean | Certified organic indicator |
| `isAvailable` | Boolean | - | No | `true` | Boolean | Whether item is active for purchase |
| `city` | String | Text Index | Yes | `null` | Searchable | Sourcing city |
| `rating` | Number | - | No | `0` | Range: 0.0 - 5.0 | Average rating score |
| `totalReviews` | Number | - | No | `0` | Min: 0 | Count of customer reviews |
| `createdAt` | Date | - | No | Auto (now) | ISODate | Listing creation date |
| `updatedAt` | Date | - | No | Auto (now) | ISODate | Listing update date |

---

### 3.4 Collection: `orders`
**Description**: Complete customer purchase records, logistics tracking, and settlement information.

| Column / Field | Data Type | Key / Ref | Nullable | Default Value | Constraints & Validation | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | No | Auto (UUID) | Auto-generated | Internal database identifier |
| `orderNumber` | String | Unique Index | No | None | Unique string | Order reference code (e.g., `ORD-1725...`) |
| `customerId` | ObjectId | Foreign Key | No | None | Ref: `User._id` | Buying customer reference |
| `farmerId` | ObjectId | Foreign Key | No | None | Ref: `FarmerProfile._id` | Selling farm reference |
| `items` | Array[Object] | Subdocument | No | `[]` | Minimum 1 item | List of ordered products (see schema below) |
| `items[i].product` | ObjectId | Foreign Key | No | None | Ref: `Product._id` | Ordered product reference |
| `items[i].name` | String | - | No | None | Required | Name snapshot at time of purchase |
| `items[i].quantity` | Number | - | No | None | Min: 1 | Quantity bought |
| `items[i].price` | Number | - | No | None | Min: 0 | Unit price snapshot at time of purchase |
| `items[i].image` | String | - | Yes | `null` | Image URL | Product thumbnail snapshot |
| `deliveryAddress` | Object | Subdocument | Yes | None | Embedded object | Shipping destination address |
| `deliveryAddress.address` | String | - | Yes | `null` | Free text | Street address |
| `deliveryAddress.city` | String | - | Yes | `null` | Free text | Delivery city |
| `deliveryAddress.state` | String | - | Yes | `null` | Free text | Delivery state |
| `deliveryAddress.pincode` | String | - | Yes | `null` | Free text | Delivery postal code |
| `receiverName` | String | - | Yes | `null` | Free text | Recipient name |
| `receiverPhone` | String | - | Yes | `null` | Free text | Recipient phone number |
| `paymentMethod` | String | - | No | None | Enum: `['UPI', 'Card', 'Net Banking', 'COD']` | Payment method chosen |
| `paymentStatus` | String | - | No | `'Pending'` | Enum: `['Pending', 'Completed', 'Failed', 'Refunded']` | Transaction outcome status |
| `paymentId` | String | - | Yes | `null` | Gateway ID | Razorpay or external transaction token |
| `orderStatus` | String | - | No | `'Placed'` | Enum: `['Placed', 'Accepted', 'Packed', 'Out For Delivery', 'Delivered', 'Cancelled']` | Fulfillment pipeline step |
| `subtotal` | Number | - | No | None | Min: 0 | Sum of item totals in INR |
| `deliveryCharge` | Number | - | No | None | Min: 0 | Applicable shipping cost |
| `totalAmount` | Number | - | No | None | Min: 0 | Grand total payable in INR |
| `placedAt` | Date | - | Yes | `null` | ISODate | Order placement timestamp |
| `acceptedAt` | Date | - | Yes | `null` | ISODate | Farmer acceptance timestamp |
| `packedAt` | Date | - | Yes | `null` | ISODate | Packaging complete timestamp |
| `outForDeliveryAt` | Date | - | Yes | `null` | ISODate | Dispatch timestamp |
| `deliveredAt` | Date | - | Yes | `null` | ISODate | Delivery confirmation timestamp |
| `cancelledAt` | Date | - | Yes | `null` | ISODate | Cancellation timestamp |
| `createdAt` / `updatedAt` | Date | - | No | Auto (now) | ISODate | Record lifecycle timestamps |

---

### 3.5 Collection: `payments`
**Description**: Independent financial auditing ledger recording payment attempts and outcomes.

| Column / Field | Data Type | Key / Ref | Nullable | Default Value | Constraints & Validation | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | No | Auto (UUID) | Auto-generated | Unique payment transaction ID |
| `orderId` | ObjectId | Foreign Key | No | None | Ref: `Order._id` | Associated order identifier |
| `amount` | Number | - | No | None | Required, Min: 0 | Payment amount in INR (₹) |
| `paymentMethod` | String | - | Yes | None | Enum: `['UPI', 'Card', 'Net Banking', 'COD']` | Payment provider used |
| `paymentStatus` | String | - | No | `'Pending'` | Enum: `['Pending', 'Completed', 'Failed', 'Refunded']` | Result of transaction |
| `transactionRef` | String | - | Yes | `null` | Free text | Gateway reference code / UTR number |
| `createdAt` | Date | - | No | Auto (now) | ISODate | Transaction initialization timestamp |
| `updatedAt` | Date | - | No | Auto (now) | ISODate | Last payment status update timestamp |

---

### 3.6 Collection: `reviews`
**Description**: Feedback, ratings, and comments submitted by verified purchasers.

| Column / Field | Data Type | Key / Ref | Nullable | Default Value | Constraints & Validation | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | No | Auto (UUID) | Auto-generated | Review unique ID |
| `product` | ObjectId | Foreign Key | No | None | Ref: `Product._id` | Reviewed item ID |
| `order` | ObjectId | Foreign Key | No | None | Ref: `Order._id` | Purchase verification ID |
| `user` | ObjectId | Foreign Key | No | None | Ref: `User._id` | Author customer ID |
| `farmer` | ObjectId | Foreign Key | No | None | Ref: `FarmerProfile._id` | Producer farmer profile ID |
| `rating` | Number | - | No | None | Min: 1, Max: 5 | Customer star rating |
| `comment` | String | - | No | None | Required, free text | Customer review body |
| `createdAt` | Date | - | No | Auto (now) | ISODate | Submission timestamp |
| `updatedAt` | Date | - | No | Auto (now) | ISODate | Modification timestamp |

*Compound Unique Constraint*: `{ product: 1, order: 1, user: 1 }` prevents duplicate reviews for the same order and product.

---

### 3.7 Collection: `carts`
**Description**: Persistent user shopping carts storing selected items prior to checkout.

| Column / Field | Data Type | Key / Ref | Nullable | Default Value | Constraints & Validation | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | No | Auto (UUID) | Auto-generated | Cart instance ID |
| `userId` | ObjectId | Foreign Key | No | None | Ref: `User._id` | Owning customer account ID |
| `items` | Array[Object] | Subdocument | Yes | `[]` | List of items | Cart items array |
| `items[i].product` | ObjectId | Foreign Key | No | None | Ref: `Product._id` | Product added to cart |
| `items[i].quantity` | Number | - | No | 1 | Min: 1 | Quantity selected |
| `createdAt` / `updatedAt` | Date | - | No | Auto (now) | ISODate | Session timestamps |

---

## 4. Admin API Endpoints

The Admin controls the database via the following authenticated backend endpoints (`role === 'admin'`):

| Endpoint | Method | Description | Affected Collections |
| :--- | :--- | :--- | :--- |
| `/api/users/admin/dashboard` | `GET` | Aggregated dashboard KPI counters | `users`, `orders`, `farmerprofiles` |
| `/api/users` | `GET` | List all registered users with profiles | `users`, `farmerprofiles` |
| `/api/users/admin/farmers/:id/approve` | `PUT` | Approve farmer onboarding application | `farmerprofiles` (`verificationStatus = 'approved'`) |
| `/api/users/admin/farmers/:id/reject` | `PUT` | Reject farmer onboarding application | `farmerprofiles` (`verificationStatus = 'rejected'`) |
| `/api/orders/admin/all` | `GET` | Fetch all marketplace orders | `orders` |
| `/api/orders/admin/payments` | `GET` | Audit payment records | `payments`, `orders` |
| `/api/reviews/admin/all` | `GET` | Moderate all submitted reviews | `reviews` |
| `/api/products?limit=1000` | `GET` | Inspect complete product catalog | `products` |
