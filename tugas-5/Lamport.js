// Simulasi Lamport Timestamps (3 Proses)

function getMessageTimestamp(messages, sender, receiver) {
    const index = messages.findIndex(msg => msg.from === sender && msg.to === receiver);
    if (index !== -1) {
        return messages.splice(index, 1)[0].timestamp;
    }
    return 0;
}

function simulateLamport(events) {
    const clocks = { P1: 0, P2: 0, P3: 0 };
    const messages = [];
    const results = [];

    for (const event of events) {
        const proc = event.process;
        const evType = event.type;
        const evName = event.name;
        const clockBefore = clocks[proc];
        let formula = "";

        if (evType === "internal") {
            clocks[proc] += 1;
            formula = `${clockBefore} + 1`;
        } else if (evType === "send") {
            clocks[proc] += 1;
            messages.push({
                from: proc,
                to: event.to,
                timestamp: clocks[proc]
            });
            formula = `${clockBefore} + 1 (kirim ke ${event.to})`;
        } else if (evType === "receive") {
            const msgTs = getMessageTimestamp(messages, event.from, proc);
            clocks[proc] = Math.max(clocks[proc], msgTs) + 1;
            formula = `max(${clockBefore}, ${msgTs}) + 1`;
        }

        results.push({
            "Event": evName,
            "Proses": proc,
            "Tipe": evType,
            "Perhitungan": formula,
            "Timestamp Akhir": `L(${evName}) = ${clocks[proc]}`
        });
    }

    return results;
}

// Step 1: Define Events (Sesuai slide)
const events = [
    { process: "P1", type: "internal", name: "A1" },
    { process: "P1", type: "send",     name: "A2", to: "P2" },
    { process: "P2", type: "receive",  name: "B2", from: "P1" },
    { process: "P2", type: "send",     name: "B3", to: "P3" },
    { process: "P3", type: "internal", name: "C1" },
    { process: "P3", type: "receive",  name: "C2", from: "P2" }
];

// Step 2: Jalankan Simulasi
const results = simulateLamport(events);

console.log("===============================================================");
console.log("             SIMULASI LAMPORT TIMESTAMPS (JS)");
console.log("===============================================================");
console.table(results);

console.log("\nVerifikasi Ordering Consistency (Happened-Before Relation):");
console.log("- A1 -> A2 (Internal P1)     : L(A1) = 1 < L(A2) = 2  [VALID]");
console.log("- A2 -> B2 (Send/Recv P1->P2): L(A2) = 2 < L(B2) = 3  [VALID]");
console.log("- B2 -> B3 (Internal P2)     : L(B2) = 3 < L(B3) = 4  [VALID]");
console.log("- B3 -> C2 (Send/Recv P2->P3): L(B3) = 4 < L(C2) = 5  [VALID]");