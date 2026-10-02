# HarvestDirect / FarmDirect — Audit & Fix Log

This documents everything that was checked and fixed in this pass.
Both the frontend (`npm run build`) and backend (`node --check` on every
file) were verified after these changes; the frontend build is clean.

## Backend

1. **Install-breaking dependency conflict (`backend/package.json`)**
   `cloudinary@^2.10.1` was listed alongside `multer-storage-cloudinary@4.0.0`,
   which requires `cloudinary@^1.x` as a peer dependency — `npm install`
   would fail with an unresolvable peer conflict on a fresh clone.
   Neither package was actually used anywhere (uploads use local disk
   storage via `multer`, see `src/utils/upload.js`), so both were removed.

2. **Missing endpoint: `GET /api/users/farmer/:id/profile`**
   The frontend's Farmer Profile page called this route, but it did not
   exist anywhere in `userRoutes.js` / `userController.js`. Added
   `getFarmerPublicProfile` — looks up a `FarmerProfile` by either its own
   `_id` or the underlying `userId`, and returns the farmer + their
   available products.

3. **`getFarmerOrders` didn't populate the customer**
   Farmer/Admin order tables show the customer's name, but
   `Order.find({ farmerId })` never populated `customerId`, so it was
   always blank/`undefined`. Added `.populate('customerId', 'name email phone')`.

4. **New: `POST /api/contact`**
   The Contact page's form previously submitted nowhere. Added a
   `contactController` that uses the `nodemailer` config already present
   in `.env` (falls back to just logging server-side if SMTP env vars
   aren't set, so it still works out of the box in dev).

## Frontend

1. **`ProductDetails.jsx`**
   - Fixed field-name mismatches with the actual API shape:
     `product.farmer` → `product.farmerId`, `product.organic` →
     `product.isOrganic`, `product.stock` → `product.quantity`,
     `product.reviewCount` → `product.totalReviews`.
   - These mismatches meant the organic badge never rendered, the
     quantity stepper produced `NaN` (`Math.min(undefined, ...)`), and
     the "View Profile" link went to `/farmer/undefined`.
   - "Buy Now" previously did nothing but show an alert for non-customers;
     it now adds to cart and navigates to `/checkout`.

2. **`Products.jsx`**
   - Same `farmerId` / `isOrganic` / `quantity` field fixes as above.
   - The categories API returns a plain array of strings
     (`Product.distinct('category')`), but the page was treating each
     entry as `{ name, count }` — categories, checkboxes, and counts were
     all broken. Rewrote to use real category names and real counts
     derived from the loaded product list.
   - Search box, category checkboxes, organic toggle, and sort dropdown
     were pure UI with no effect on the results. Wired all of them to an
     actual client-side filter/sort pipeline.
   - Reads `?category=` and `?organic=true` query params on load (used by
     the new Home page category buttons).
   - Removed the dummy random category counts.

3. **`FarmerProfile.jsx` — full rewrite**
   Previously called a non-existent backend route
   (`/api/users/farmer/:id/profile`) at the wrong port (`5000` instead of
   `5001`) using raw `axios` instead of the shared client, and expected
   fields (`bannerImage`, `journey`, `tags`) that don't exist in any
   schema. The "Add to Order" button was an empty comment. Reviews were
   hardcoded (`4.9 · 128 Reviews`).
   Rewritten to call the new backend endpoint, render real
   `FarmerProfile` fields, list the farmer's real products, support
   "Add to Order" via the cart API, and show real reviews from
   `/api/reviews/farmer/:id`.

4. **`TrackOrder.jsx` — full rewrite**
   Was 100% hardcoded (fake order number, fake dates, fake timeline).
   Now fetches the logged-in customer's orders via `/api/orders/myorders`,
   picks the most relevant one (active, or most recent), and renders a
   real timeline driven by the order's `placedAt` / `acceptedAt` /
   `packedAt` / `outForDeliveryAt` / `deliveredAt` timestamps and
   `orderStatus`, including a distinct state for `Cancelled` orders.

5. **`FarmerDashboard.jsx`**
   - `orderStatusOptions` used values (`Pending`, `Processing`, `Shipped`)
     that don't exist in the `Order` schema's enum
     (`Placed, Accepted, Packed, Out For Delivery, Delivered, Cancelled`).
     Any status update other than a lucky match would have failed
     validation on save. Fixed to match the real enum.
   - The "Pending Orders" table filtered on `orderStatus === 'Pending'`,
     a status that can never occur (the default is `'Placed'`), so the
     table was always empty and farmers could never action new orders.
     Fixed the filter and the default status the "Process" button sends.
   - `order.customer?.name` → `order.customerId?.name` (matches the
     actual populate field; combined with the backend populate fix above,
     customer names now show up correctly).
   - `unitOptions` included `lb` and `liter`, which aren't valid enum
     values on the `Product` schema (`kg, gram, litre, piece, dozen`) —
     selecting them would fail product creation. Fixed to match.
   - `paymentStatus` comparisons used a lowercase `'paid'` that never
     matches the schema's `'Completed'` — fixed both the sales total and
     the badge coloring.

6. **`Navbar.jsx` / `Footer.jsx`**
   Both linked "Meet the Farmers" to `/farmer/green-valley` — a fake,
   non-existent ID that would 404 every time. Pointed both at `/products`
   instead, since there's no farmer-directory page yet.

7. **`Login.jsx`**
   The Customer/Farmer/Admin toggle was purely cosmetic — the backend has
   no concept of "login as a role," so logging into a farmer account from
   the "Customer" tab would silently land you on the customer view. Now,
   after a successful login, the actual returned role is checked against
   the selected tab; on a mismatch the user is logged back out with a
   clear message instead of being silently misrouted.

8. **`Contact.jsx`**
   Wired the form to the new `/api/contact` endpoint with real state,
   submit handling, and success/error messaging (previously the form had
   no `onSubmit` and posted nowhere).

9. **`Home.jsx`**
   Added a real "Fresh This Week" section pulling live products from
   `/api/products`, and wired the category quick-buttons to navigate to
   `/products` with the corresponding filter applied.

## Verified but left as-is (not bugs)

- `Cart.jsx` and `Checkout.jsx` were already correctly wired to the
  backend. Checkout currently assumes a single-farmer cart (uses only
  `items[0]`'s farmer) — this matches how `Order` is modeled
  (one `farmerId` per order), so it's a design constraint, not a bug.
- `AdminDashboard.jsx` was already correctly using `customerId` /
  `farmerId` populate fields.
- `About.jsx` is an intentionally static marketing page.
- Cart line items show "Local Farm" instead of the real farm name — the
  cart's populate only pulls `farmerId` as a raw ID, not the farm name.
  Left as a minor cosmetic item since it doesn't break functionality.

## Multi-tab / multi-role login isolation (session storage fix)

**Problem:** the app stored the logged-in user (including JWT) in
`localStorage`. `localStorage` is shared across every tab of the same
browser/origin — so logging in as a farmer in one tab silently overwrote
a customer session open in another tab, and `api.js`'s request
interceptor read the token from that same shared key on every request.
Switching tabs would show you "converted" into whichever account logged
in most recently, anywhere.

**Fix:** added `src/services/authStorage.js`, a small centralized module
that uses `sessionStorage` (tab-scoped, even same-origin) as the source of
truth for each tab's session, instead of `localStorage`:

- `getSessionUser()` / `setSessionUser()` / `updateSessionUser()` /
  `clearSessionUser()` are now the only ways the app reads or writes auth
  state.
- An optional **"Remember Me"** (already had a checkbox on the Login page
  that did nothing before) now works: checking it also saves a template
  to `localStorage`. That template is only ever *copied* into a brand-new
  tab's `sessionStorage` the first time that tab loads with no session of
  its own — it never overwrites a tab that's already logged in. So:
  - Tab A logs in as a customer with "Remember Me" checked.
  - Tab B is opened fresh → it inherits the remembered customer session.
  - Tab B then logs in as a farmer instead → only Tab B changes.
  - Tab A is completely untouched and stays logged in as the customer.
  - Logging out clears both the current tab's session and the remembered
    template — logging out means logging out.
- `src/services/api.js`'s request interceptor now reads the token via
  `getSessionUser()` instead of raw `localStorage`, and its 401 handler
  clears only the current tab's session (via `clearSessionUser()`) before
  redirecting to `/login`, rather than leaving stale/invalid tokens around.
- `authSlice.js` now has an `updateUser` action for profile edits, which
  persists to the current tab's session storage via `updateSessionUser()`
  — `FarmerDashboard.jsx` and `CustomerDashboard.jsx` were previously
  hand-rolling `localStorage.getItem('user')` / `setItem` directly on
  profile update (also full-page-reloading afterwards); both now dispatch
  `updateUser(...)` instead, so no other tab's session is ever touched by
  one tab's profile edit.
- `Login.jsx`'s "Remember Me" checkbox is now actually passed into the
  `login` thunk instead of being purely decorative.

## Admin "Database Records" view — see every collection as actually stored

Added a dedicated Admin Dashboard tab ("Database Records") that shows the
raw contents of every collection in the database, exactly as they're
stored, rather than the summarized views the other admin tabs show:

- **Users** — Name, Email, Password (shown as a redacted placeholder —
  password hashes are never sent to the frontend in the first place,
  since the `User` schema marks the field `select: false`), and **Role**.
  This is also where you can see that farmers and admins are stored in
  the *same* `Users` collection as customers, distinguished only by the
  `role` field (`customer` / `farmer` / `admin`) — there's no separate
  table for them.
- **Products** — Name, Price, Quantity, Farmer ID, Image, Category.
- **Orders** — Customer ID, Product ID(s) + Quantity per item, Status,
  Payment status.
- **Reviews** — Customer ID, Product ID, Rating, Comment.
- **Payments** — Amount, Order ID, Payment Status.

**New: a real `Payments` collection.** Previously there was no separate
Payments table — payment fields (`paymentMethod`, `paymentStatus`,
`paymentId`) were only ever embedded inside each `Order` document. Added
`backend/src/models/Payment.js` as its own collection, linked to `Order`
via `orderId`. A `Payment` document is now created automatically whenever
an order is placed, and kept in sync whenever a farmer/admin updates an
order's status (e.g. marking an order "Delivered" sets its payment to
"Completed"; "Cancelled" sets it to "Refunded" or "Failed" depending on
whether it had already been paid).

**New backend endpoints (admin-only):**
- `GET /api/orders/admin/payments` — all payment records, with each
  payment's order (and that order's customer) populated.
- `GET /api/reviews/admin/all` — all reviews across every product/farmer,
  with the reviewing customer, product, and farmer populated.

(`GET /api/users` and `GET /api/products` already returned everything
needed for the Users and Products tables, so no changes were needed
there.)

## Known environment limitation

This sandbox's outbound network only allows package registries
(npm/pip/etc.), not MongoDB Atlas, so the backend can't fully connect to
the database from here. The server itself starts correctly and all files
pass `node --check`; a real deployment with network access to your Mongo
URI should connect normally.
