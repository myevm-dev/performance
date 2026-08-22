# Firebase Donation Sync

This is separate from both Vite applications. It keeps `badaRawUploads` private and publishes only sanitized server donation totals.

## What it does

- `syncDonationWeek` runs whenever a raw BADA upload is created or updated.
- It parses `Name` and `Excluded Net Sales` from the stored TSV.
- It excludes the `Agent, Olo` system row.
- It writes public summaries to `stores/{storeNumber}/donationPublishedWeeks/{weekKey}`.
- `backfillDonationWeeks` processes existing raw uploads after one Firestore request document is created.

Firestore triggers run with administrative access and are not controlled by client security rules. The output is idempotent, so repeated trigger delivery produces the same weekly document.

## Setup

Cloud Functions deployment requires the Firebase project to use the Blaze plan.

1. Copy this package into a clean directory.
2. From the package root, select the existing Firebase project:

```bash
firebase use --add
```

3. Install and build:

```bash
cd functions
npm install
npm run build
cd ..
```

4. Deploy:

```bash
firebase deploy --only functions:donation-sync
```

5. Add `firestore-rules-addition.txt` inside the existing Firestore rules file and deploy the rules.

## Run the existing-data backfill once

In the Firebase Firestore console, create this document:

```text
Collection: donationBackfillRequests
Document ID: no-kids-hungry-2026
```

Add these string fields:

```text
startDate: 2026-08-19
endDate: 2026-10-27
```

The function changes `status` from `running` to `completed` and records `processedWeeks` and `processedRows`. Creating this one document replaces manually republishing every old week.

## Reader

The reader should query both:

- `badaPublishedWeeks` to know whether a business week was published.
- `donationPublishedWeeks` to obtain sanitized weekly server totals.

It can show `Sync` when BADA exists but the donation summary does not, `$0.00` for a successfully synced zero value, and a dash for an unpublished week.

The first competition column is Aug 13 through Aug 19 because the fundraiser begins Wednesday, Aug 19. The last is Oct 22 through Oct 28 because it ends Tuesday, Oct 27.

Note: the source report says Excluded Net Sales can also include delivery fees, gift cards, certificates, game revenue share, and customer deposits.
