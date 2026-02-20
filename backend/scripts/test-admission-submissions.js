
const http = require('http');

async function postData(url, data) {
    return new Promise((resolve, reject) => {
        const dataString = JSON.stringify(data);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': dataString.length,
            },
        };

        const req = http.request(url, options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                try {
                    // Check for 200-299 status
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const json = JSON.parse(responseBody);
                        resolve(json);
                    } else {
                        reject(new Error(`Status ${res.statusCode}: ${responseBody}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(dataString);
        req.end();
    });
}

const BASE_URL = 'http://localhost:3000/api/admission/submit';

const TIMESTAMP = Date.now();

async function testSubmission(type, index) {
    const uniqueId = `${TIMESTAMP}${index}`;
    const payload = {
        program: "btech",
        admissionType: type,
        name: `Test ${type} User ${uniqueId}`,
        dateOfBirth: "2005-01-01",
        gender: "male",
        email: `test.${type}.${uniqueId}@example.com`,
        phone: `99${uniqueId.slice(-8)}`,
        aadhaar: `1000${uniqueId.slice(-8)}`,
        preferredDepartment: "1", // CSE
        permanentAddress: "Test Address 123",
        stateOfResidence: "Kerala",
        category: "General",
        qualifyingExam: "HSE",
        qualifyingExamRegisterNo: `REG00${index}`,
        physicsScore: "90",
        chemistryScore: "90",
        mathsScore: "90",
        totalPercentage: "90",
        entranceExamScore: "100", // Common for all for testing
        entranceExamType: "KEAM",
        entranceExamRollNumber: `ROLL${uniqueId.slice(-4)}`,
        entranceRank: "5000",
        // Bank info
        bankAccountNumber: `10000000${index}`,
    };

    try {
        console.log(`Submitting ${type.toUpperCase()} application...`);
        const result = await postData(BASE_URL, payload);
        console.log(`[SUCCESS] ${type}: Admission Number -> ${result.data?.admission_number} (ID: ${result.data?.id})`);
    } catch (error) {
        console.error(`[FAILED] ${type}:`, error.message);
    }
}

async function main() {
    console.log("Starting Admission Submission Tests...");

    // 1. Regular
    await testSubmission("regular", 1);

    // 2. Lateral
    await testSubmission("lateral", 2);

    // 3. NRI
    await testSubmission("nri", 3);

    // 4. Management
    await testSubmission("management", 4);
}

main();
