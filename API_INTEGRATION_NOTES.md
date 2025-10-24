# Next Plan API Integration Notes

## Overview
The subscription page has been updated to display "Next Plan" information instead of "Subscription Info" in the modal view.

## Changes Made

### 1. UI Updates
- Changed modal section title from "Subscription Info" to "Next Plan"
- Updated the content to display next plan details:
  - Plan Name
  - Price
  - Duration
  - Start Date
  - Status (Scheduled/Not scheduled)

### 2. Data Structure Updates
- Added `nextPlan` field to the subscription data transformation in `fetchSubscriptions()`
- The `nextPlan` object should contain:
  ```javascript
  nextPlan: {
    planName: string,
    price: number,
    duration: string,
    startDate: string (ISO date),
    // Add other relevant fields as needed
  }
  ```

## API Integration Required

### Backend API Changes Needed
1. Update the `/users` endpoint to include `nextPlan` data in the response
2. The `nextPlan` field should be included in each user object returned by the API

### Expected API Response Structure
```javascript
{
  success: true,
  data: [
    {
      _id: "user_id",
      name: "User Name",
      email: "user@example.com",
      // ... existing fields
      nextPlan: {
        planName: "Premium Plan",
        price: 29.99,
        duration: "1 month",
        startDate: "2025-02-01T00:00:00.000Z"
      } || null // null if no next plan scheduled
    }
  ]
}
```

## Files Modified
- `/src/app/dashboard/subscriptions/page.js`
  - Line ~1170: Updated modal section from "Subscription Info" to "Next Plan"
  - Line ~145: Added `nextPlan` field to data transformation

## Testing
- Test with users who have scheduled next plans
- Test with users who don't have next plans (should show "No next plan scheduled")
- Verify the date formatting works correctly
- Test the price formatting with the `formatCurrency` function

## Future Enhancements
- Add ability to schedule/modify next plans from the UI
- Add notifications for upcoming plan changes
- Consider adding next plan preview in the main table view