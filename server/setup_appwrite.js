import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'default';

if (!PROJECT_ID || !API_KEY) {
    console.error('✗ Error: VITE_APPWRITE_PROJECT_ID and APPWRITE_API_KEY must be set in .env');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function setup() {
    console.log('--- Starting Ladina Database Setup ---');
    console.log(`ℹ Using Database: ${DATABASE_ID}`);

    const collections = [
        {
            id: process.env.VITE_APPWRITE_INVOICES_COL_ID || 'invoices',
            name: 'Invoices',
            attributes: [
                { key: 'invoiceNo', type: 'string', size: 100, required: true },
                { key: 'billedTo', type: 'string', size: 255, required: true },
                { key: 'date', type: 'string', size: 50, required: true },
                { key: 'currency', type: 'string', size: 10, required: false, default: 'USD' },
                { key: 'total', type: 'float', required: true },
                { key: 'status', type: 'string', size: 50, required: false, default: 'draft' },
                { key: 'lineItems', type: 'string', size: 10000, required: true }
            ]
        },
        {
            id: process.env.VITE_APPWRITE_RECEIPTS_COL_ID || 'receipts',
            name: 'Receipts',
            attributes: [
                { key: 'receiptNo', type: 'string', size: 100, required: true },
                { key: 'invoiceId', type: 'string', size: 50, required: true },
                { key: 'amount', type: 'float', required: true },
                { key: 'date', type: 'string', size: 50, required: true }
            ]
        },
        {
            id: process.env.VITE_APPWRITE_BANK_COL_ID || 'bankDetails',
            name: 'Bank Details',
            attributes: [
                { key: 'bankName', type: 'string', size: 255, required: true },
                { key: 'bankCode', type: 'string', size: 100, required: false },
                { key: 'branch', type: 'string', size: 100, required: false },
                { key: 'accountName', type: 'string', size: 255, required: true },
                { key: 'accountNumberUSD', type: 'string', size: 100, required: false },
                { key: 'accountNumberKES', type: 'string', size: 100, required: false },
                { key: 'swiftCode', type: 'string', size: 50, required: false }
            ]
        }
    ];

    for (const col of collections) {
        try {
            await databases.createCollection(DATABASE_ID, col.id, col.name, ['read("any")', 'create("users")', 'update("users")', 'delete("users")'], true);
            console.log(`✓ Created Collection: ${col.name}`);

            for (const attr of col.attributes) {
                try {
                    if (attr.type === 'string') {
                        await databases.createStringAttribute(DATABASE_ID, col.id, attr.key, attr.size, attr.required, attr.default);
                    } else if (attr.type === 'float') {
                        await databases.createFloatAttribute(DATABASE_ID, col.id, attr.key, attr.required);
                    }
                    console.log(`  - Attribute built: ${attr.key}`);
                } catch (e) {
                     if (e.code !== 409) console.error(`    ✗ Error attribute ${attr.key}:`, e.message);
                }
            }
        } catch (e) {
            if (e.code === 409) {
                console.log(`ℹ Collection ${col.name} already exists.`);
            } else {
                console.error(`✗ Error building ${col.name}:`, e.message);
            }
        }
    }

    console.log('\n--- Inserting Initial Data ---');
    const bankInfo = {
        bankName: 'NCBA, Kenya',
        bankCode: '07000',
        branch: 'Yaya Centre (Code-030)',
        accountName: 'Ladina Travel Safaris Ltd',
        accountNumberUSD: '5213170028',
        accountNumberKES: '5213170012',
        swiftCode: 'CBAFKENX'
    };

    try {
        const colId = process.env.VITE_APPWRITE_BANK_COL_ID || 'bankDetails';
        await databases.createDocument(DATABASE_ID, colId, 'current', bankInfo);
        console.log('✓ Initialized Bank Details in Cloud');
    } catch (e) {
        if (e.code === 409) {
            console.log('✓ Bank Details already verified in Cloud');
        } else {
            console.error('✗ Failed to insert bank details:', e.message);
        }
    }

    console.log('\n--- Setup Complete! ---');
    console.log('Visit your Appwrite Console to see the data!');
}

setup();
