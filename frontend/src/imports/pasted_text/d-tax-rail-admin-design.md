DESIGN A COMPLETE MODERN ADMIN PANEL UI/UX FOR A TAX FILING PLATFORM CALLED “D TAX RAIL”.

IMPORTANT:
This is NOT a payment gateway platform.
NO Razorpay.
NO Stripe.
NO online payment integrations.

Payments are handled OFFLINE / UPI manually outside the app.

The admin panel only TRACKS PAYMENT STATUS for each filing/order.

The admin panel must visually match the existing customer mobile application.

The customer app already includes:

* onboarding
* login with OTP/biometric
* dashboard
* tax tools
* filing workflow
* upload documents
* filing progress tracking
* my returns/orders
* support FAQs
* callback requests
* profile/settings
* notifications

The admin panel must manage ALL those workflows internally.

---

## OVERALL STYLE

Create a PREMIUM FINTECH TAX ADMIN DASHBOARD.

The UI should feel like:

* enterprise-grade
* clean
* trustworthy
* modern SaaS
* soft fintech aesthetic
* premium internal operations software

NOT:

* generic bootstrap admin
* dark hacker UI
* cluttered ERP
* sharp-corner dashboard

Use:

* white backgrounds
* soft blue gradients
* subtle green success tones
* floating rounded cards
* soft shadows
* premium spacing
* large clean typography
* modern glassmorphism touches
* elegant tables
* clean analytics layout

---

## DESIGN SYSTEM

Brand Name:
D Tax Rail

Typography:
Poppins

Primary:
#1A56DB

Primary Dark:
#1040B0

Primary Light:
#E8EFFF

Accent Green:
#2DAB6F

Accent Light:
#E6F7EF

Background:
#FFFFFF

Surface:
#F5F7FF

Card Background:
#FFFFFF

Text Dark:
#0D1B3E

Text Mid:
#4A5568

Text Light:
#8896AB

Divider:
#E2E8F0

Error:
#E53E3E

Success:
#2DAB6F

Warning:
#F6AD55

Review Blue:
#63B3ED

Border Radius:
16px–24px

Shadow:
0 4px 16px rgba(0,0,0,0.04)

---

## TARGET PLATFORM

Desktop-first web admin panel.

Responsive for:

* desktop
* laptop
* tablet

Built visually for:

* Next.js
* TypeScript
* TailwindCSS
* ShadCN UI
* Framer Motion

The design should feel scalable and production-ready.

---

## ADMIN PANEL STRUCTURE

Design these pages/screens:

1. Login Screen
2. Main Dashboard
3. Filings Management
4. Filing Details
5. Customers Management
6. Payment Status Management
7. Document Verification
8. Callback Requests
9. Support & FAQs
10. Notifications Center
11. Tax Tools CMS
12. Admin Profile
13. Settings
14. Activity Logs

---

1. LOGIN SCREEN

---

Create a premium admin login page.

Layout:
Split screen.

LEFT SIDE:

* soft abstract tax-themed illustration
* floating blue/green shapes
* secure fintech visuals
* subtle document/tax graphics

RIGHT SIDE:
Centered login card.

Include:

* D Tax Rail logo
* “Welcome Back”
* subtitle:
  “Secure admin access to tax operations”
* email input
* password input
* remember me checkbox
* forgot password
* login button
* security badge

Style:

* white glassmorphism card
* large rounded corners
* elegant spacing
* premium SaaS feel

---

2. MAIN DASHBOARD

---

Create a modern enterprise dashboard.

TOP NAVBAR:

* global search
* notifications bell
* admin avatar
* quick actions
* date filter

LEFT SIDEBAR:

* Dashboard
* Filings
* Customers
* Payments
* Documents
* Callbacks
* Support
* Notifications
* Tax Tools
* Settings
* Logs

Sidebar style:

* floating
* rounded
* collapsible
* soft blue active indicator

---

## DASHBOARD CONTENT

TOP ANALYTICS CARDS:

* Total Filings
* Pending Reviews
* Completed Returns
* Pending Payments
* Active Callbacks
* Open Notices

Each card:

* soft gradient
* icon
* mini analytics graph
* percentage increase/decrease
* elegant hover animation

---

## RECENT FILINGS TABLE

Columns:

* Order ID
* Customer Name
* PAN
* Filing Type
* Filing Year
* Filing Status
* Payment Status
* Assigned Admin
* Last Updated
* Action

Statuses:
Pending
In Review
Filed
Completed
Rejected

Status badges:

* rounded pills
* soft colors
* premium typography

---

## PAYMENT STATUS SYSTEM

IMPORTANT:
There is NO payment gateway integration.

Admin ONLY tracks payment status.

Add payment statuses:

* Payment Pending
* Paid via UPI
* Verification Pending
* Failed
* Refunded

Show:

* UPI reference ID
* payment screenshot upload
* verification timestamp
* verified by admin

Actions:

* Mark as Paid
* Verify Payment
* Reject Payment
* Add Notes

---

3. FILINGS MANAGEMENT PAGE

---

Main operational page.

Add:

* advanced filters
* search bar
* export options
* pagination

Filters:

* Filing Year
* Filing Type
* Status
* Payment Status
* Assigned Admin
* Date Range

Each filing row/card:

* customer details
* PAN
* phone
* filing stage
* uploaded documents count
* payment status
* completion percentage

Actions:

* Open Details
* Assign Operator
* Request Documents
* Upload Acknowledgement
* Change Status
* Mark Completed

---

4. FILING DETAILS PAGE

---

MOST IMPORTANT PAGE.

Modern detailed workspace layout.

HEADER:

* customer avatar
* customer name
* PAN
* mobile
* email
* filing year
* filing type
* payment status
* order ID

Add quick action buttons:

* Verify Documents
* Update Filing Stage
* Upload Acknowledgement
* Send Notification
* Download All Docs

---

## TABS INSIDE FILING DETAILS

Tabs:

* Overview
* Documents
* Timeline
* Payment
* Notes
* Notifications

---

## OVERVIEW TAB

Show:

* filing progress tracker
* operator assigned
* submission date
* payment verification
* pending actions
* completion percentage
* customer remarks

---

## DOCUMENTS TAB

Show uploaded customer documents.

Document cards:

* preview thumbnail
* file type
* upload date
* verification status
* comments

Actions:

* Verify
* Reject
* Request Reupload
* Download

Supported docs:

* PAN
* Aadhaar
* Form 16
* Salary Slips
* Bank Statements
* Tax Notices

---

## TIMELINE TAB

Beautiful vertical timeline.

Events:

* PAN verified
* documents uploaded
* payment verified
* under review
* filing initiated
* acknowledgement uploaded
* completed

Each event:

* timestamp
* admin/operator name
* notes

---

## PAYMENT TAB

Again:
NO ONLINE PAYMENT GATEWAY.

This section ONLY tracks payment status.

Show:

* payment amount
* UPI transaction ID
* uploaded payment screenshot
* verification status
* admin remarks
* payment date

Add:

* Verify Payment
* Reject Payment
* Mark Pending
* Download Receipt

---

5. CUSTOMER MANAGEMENT PAGE

---

Modern customer directory.

Columns:

* Name
* PAN
* Email
* Phone
* Total Filings
* Active Cases
* Payment Status
* Last Activity

Customer detail side drawer:

* filings history
* uploaded documents
* support history
* callback history
* notifications sent

---

6. DOCUMENT VERIFICATION PAGE

---

Grid-based verification workspace.

Each document card:

* preview
* zoom
* OCR extracted info
* uploaded timestamp
* verification state

Actions:

* Approve
* Reject
* Request Reupload

Add bulk actions:

* Approve All
* Reject All

---

7. CALLBACK REQUESTS PAGE

---

Based on customer “Need Help” callback feature.

Table:

* customer
* phone
* preferred time slot
* issue
* request date
* status

Statuses:

* Pending
* Contacted
* Scheduled
* Completed

Actions:

* Assign Executive
* Mark Contacted
* Call Now
* Add Notes

---

8. SUPPORT & FAQ MANAGEMENT

---

Manage FAQs shown in customer app.

FAQ CMS:

* question
* answer
* category
* active toggle

Support ticket section:

* live conversation style
* attachments
* status updates
* operator assignment

---

9. NOTIFICATIONS CENTER

---

Manage notifications.

Notification types:

* filing updates
* payment verification updates
* reminder alerts
* missing document alerts
* filing completion updates

Channels:

* Push
* SMS
* Email

---

10. TAX TOOLS CMS

---

Manage customer app tax tools.

Admin can:

* edit deadlines
* update regime comparison
* update calculator slabs
* publish announcements

---

11. SETTINGS PAGE

---

Settings sections:

* Branding
* Roles & Permissions
* Notification Settings
* Security
* Access Control
* Session Logs

---

12. ADMIN PROFILE PAGE

---

Show:

* profile photo
* role
* activity stats
* recent actions
* permissions

---

13. ACTIVITY LOGS PAGE

---

Enterprise audit logs.

Track:

* payment verification
* document approvals
* filing updates
* login activity
* admin actions

---

## UX REQUIREMENTS

The admin panel must feel:

* calm
* fast
* premium
* organized
* scalable

Use:

* soft hover states
* subtle motion
* loading skeletons
* success animations
* upload progress bars
* empty states
* modern tables

Whitespace is VERY IMPORTANT.

---

## COMPONENTS

Use reusable:

* cards
* tables
* badges
* uploaders
* filters
* drawers
* modals
* tabs
* progress trackers

---

## IMPORTANT DESIGN DIRECTION

The admin panel MUST feel like the SAME PRODUCT as the customer mobile app.

Maintain:

* same colors
* same rounded aesthetic
* same trust-focused fintech feeling
* same premium softness

But evolve it into:
ENTERPRISE-GRADE ADMIN SOFTWARE.

The experience should feel like:
“modern Indian fintech SaaS for tax operations”.

DO NOT design a generic admin template.

The UI should feel custom-built specifically for:
TAX FILING OPERATIONS MANAGEMENT.
