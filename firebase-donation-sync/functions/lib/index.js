"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillDonationWeeks = exports.syncDonationWeek = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const REGION = "us-central1";
const DEFAULT_START_DATE = "2026-08-19";
const DEFAULT_END_DATE = "2026-10-27";
function parseMoney(value) {
    if (!value)
        return 0;
    const negative = value.includes("(") && value.includes(")");
    const amount = Number(value.replace(/[^0-9.-]/g, "")) || 0;
    return negative ? -Math.abs(amount) : amount;
}
function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
}
function getFirstAlpha(value) {
    return value.match(/[A-Za-z]/)?.[0]?.toUpperCase() ?? "";
}
function toDisplayName(rawName) {
    const cleaned = normalizeWhitespace(rawName.replace(/\./g, ""));
    if (cleaned.includes(",")) {
        const [lastRaw = "", firstRaw = ""] = cleaned.split(",");
        const firstName = normalizeWhitespace(firstRaw).split(" ")[0] ?? "";
        return normalizeWhitespace(`${firstName} ${getFirstAlpha(lastRaw)}`);
    }
    const parts = cleaned.split(" ").filter(Boolean);
    return parts.length >= 2
        ? normalizeWhitespace(`${parts[0]} ${getFirstAlpha(parts[1])}`)
        : cleaned;
}
function parseRawScorecard(fileText) {
    const lines = fileText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    const rows = [];
    for (const line of lines) {
        const columns = line
            .split("\t")
            .map((cell) => cell.replace(/^"|"$/g, "").replace(/\r/g, "").trim());
        if (columns.length < 35)
            continue;
        const originalName = columns[21];
        if (!originalName || /^agent,?\s*olo$/i.test(originalName))
            continue;
        if (originalName.includes("Restaurant #"))
            continue;
        if (originalName.includes("Server Scorecard Report"))
            continue;
        if (originalName.includes("Excluded net sales"))
            continue;
        if (originalName.includes("Page -"))
            continue;
        rows.push({
            originalName,
            mappedName: toDisplayName(originalName),
            excludedNetSales: parseMoney(columns[24]),
        });
    }
    return rows;
}
function overlapsDateRange(weekStartIso, weekEndIso, startDate, endDate) {
    return weekEndIso >= startDate && weekStartIso <= endDate;
}
function buildDonationDocument(raw, storeNumber, weekKey) {
    const fileText = raw.fileText ?? "";
    const rows = parseRawScorecard(fileText);
    return {
        storeNumber,
        weekKey,
        weekStartIso: raw.weekStartIso ?? weekKey,
        weekEndIso: raw.weekEndIso ?? weekKey,
        sourceFileName: raw.fileName ?? null,
        rows,
        rowCount: rows.length,
        totalExcludedNetSales: Number(rows.reduce((sum, row) => sum + row.excludedNetSales, 0).toFixed(2)),
        syncedAt: firestore_1.FieldValue.serverTimestamp(),
    };
}
exports.syncDonationWeek = (0, firestore_2.onDocumentWritten)({
    document: "stores/{storeNumber}/badaRawUploads/{weekKey}",
    region: REGION,
    memory: "256MiB",
    maxInstances: 5,
}, async (event) => {
    const snapshot = event.data?.after;
    if (!snapshot?.exists)
        return;
    const storeNumber = event.params.storeNumber;
    const weekKey = event.params.weekKey;
    const raw = snapshot.data();
    const weekStartIso = raw.weekStartIso ?? weekKey;
    const weekEndIso = raw.weekEndIso ?? weekKey;
    if (!raw.fileText ||
        !overlapsDateRange(weekStartIso, weekEndIso, DEFAULT_START_DATE, DEFAULT_END_DATE)) {
        return;
    }
    const destination = db.doc(`stores/${storeNumber}/donationPublishedWeeks/${weekKey}`);
    await destination.set(buildDonationDocument(raw, storeNumber, weekKey), { merge: true });
    firebase_functions_1.logger.info("Donation week synced", { storeNumber, weekKey });
});
exports.backfillDonationWeeks = (0, firestore_2.onDocumentCreated)({
    document: "donationBackfillRequests/{requestId}",
    region: REGION,
    memory: "512MiB",
    timeoutSeconds: 540,
    maxInstances: 1,
}, async (event) => {
    const requestSnapshot = event.data;
    if (!requestSnapshot)
        return;
    const request = requestSnapshot.data();
    const startDate = request.startDate ?? DEFAULT_START_DATE;
    const endDate = request.endDate ?? DEFAULT_END_DATE;
    await requestSnapshot.ref.set({
        status: "running",
        startDate,
        endDate,
        startedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    try {
        const rawUploads = await db.collectionGroup("badaRawUploads").get();
        const writer = db.bulkWriter();
        let processedWeeks = 0;
        let processedRows = 0;
        for (const rawSnapshot of rawUploads.docs) {
            const raw = rawSnapshot.data();
            const pathParts = rawSnapshot.ref.path.split("/");
            const storeNumber = raw.storeNumber ?? pathParts[1];
            const weekKey = raw.weekKey ?? rawSnapshot.id;
            const weekStartIso = raw.weekStartIso ?? weekKey;
            const weekEndIso = raw.weekEndIso ?? weekKey;
            if (!storeNumber ||
                !raw.fileText ||
                !overlapsDateRange(weekStartIso, weekEndIso, startDate, endDate)) {
                continue;
            }
            const donationDocument = buildDonationDocument(raw, storeNumber, weekKey);
            const destination = db.doc(`stores/${storeNumber}/donationPublishedWeeks/${weekKey}`);
            writer.set(destination, donationDocument, { merge: true });
            processedWeeks += 1;
            processedRows += donationDocument.rowCount;
        }
        await writer.close();
        await requestSnapshot.ref.set({
            status: "completed",
            processedWeeks,
            processedRows,
            completedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    catch (error) {
        firebase_functions_1.logger.error("Donation backfill failed", error);
        await requestSnapshot.ref.set({
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
            failedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        throw error;
    }
});
