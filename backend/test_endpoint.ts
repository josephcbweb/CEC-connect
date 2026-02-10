
import jwt from 'jsonwebtoken';
// fetch is global

const secret = 'MAYYEHC;ETAERCMULENEV;HTNE';
const payload = { userId: 837, username: "ANANTHU S NAIR" }; // ID found in debug check
const token = jwt.sign(payload, secret);

console.log("Testing with Token:", token);

async function run() {
    const res = await fetch("http://localhost:3000/api/notifications/my-notifications", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!res.ok) {
        console.log("Error:", res.status, res.statusText);
        const text = await res.text();
        console.log(text);
        return;
    }

    const json = await res.json();
    console.log("Check Result:", JSON.stringify(json, null, 2));
}

run();
