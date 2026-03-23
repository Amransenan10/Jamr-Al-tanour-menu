import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import sharp from 'sharp';
import { Buffer } from 'node:buffer';
import crypto from 'crypto';

dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const CATEGORY_ID = 'a0111111-1111-1111-1111-111111111111'; // المقبلات

function extractDriveId(url) {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

async function optimizeAndUpload(sourceBuffer, targetName) {
    try {
        console.log(`Optimizing ${targetName}...`);
        const optimizedBuffer = await sharp(sourceBuffer)
            .resize({ width: 1000, withoutEnlargement: true })
            .jpeg({ quality: 75, progressive: true })
            .toBuffer();

        console.log(`Uploading optimized ${targetName} (${Math.round(optimizedBuffer.length / 1024)} KB)`);

        const uploadRes = await fetch(`${process.env.VITE_SUPABASE_URL}/storage/v1/object/product-images/${targetName}`, {
            method: 'POST',
            headers: {
                'apikey': process.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'image/jpeg',
                'x-upsert': 'true'
            },
            body: optimizedBuffer
        });

        if (!uploadRes.ok) {
            console.error(`Upload failed for ${targetName}`, await uploadRes.text());
            return null;
        }

        return `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${targetName}`;
    } catch (e) {
        console.error(`Optimization error for ${targetName}:`, e);
        return null;
    }
}

async function downloadFromURL(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e) {
        return null;
    }
}

async function main() {
    const items = [
        {
            id: crypto.randomUUID(),
            name_ar: 'حمص',
            name_en: 'Hummous',
            description_ar: 'حمص كريمي بزيت الزيتون',
            description_en: 'Creamy hummus with olive oil',
            price: 0,
            image_filename: 'hummous.jpg',
            driveLink: 'https://drive.google.com/file/d/1oOzYRG9vvNbpk8viQzOx4NkMhnDx7ZPX/view?usp=drivesdk',
            options: [
                {
                    group_name_ar: 'الحجم',
                    group_name_en: 'Size',
                    items: [
                        { name_ar: 'صغير', name_en: 'Small', price: 6 },
                        { name_ar: 'كبير', name_en: 'Large', price: 10 }
                    ]
                }
            ]
        },
        {
            id: crypto.randomUUID(),
            name_ar: 'بابا غنوج',
            name_en: 'Baba Ghanoush',
            description_ar: 'بابا غنوج مشوي بالطريقة التقليدية',
            description_en: 'Traditional roasted eggplant dip',
            price: 6,
            image_filename: 'baba_ghanoush.jpg',
            driveLink: 'https://drive.google.com/file/d/1RD7E2e0QCj6jUO-vjYxKSJ8m0ZrODFGI/view?usp=drivesdk'
        }
    ];

    for (const item of items) {
        console.log(`Processing ${item.name_ar}...`);
        const driveId = extractDriveId(item.driveLink);
        let imageUrl = '';

        if (driveId) {
            const downloadUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download`;
            const buffer = await downloadFromURL(downloadUrl);
            if (buffer) {
                imageUrl = await optimizeAndUpload(buffer, item.image_filename);
            }
        }

        // Insert Product
        const { error: pError } = await supabase.from('products').insert({
            id: item.id,
            category_id: CATEGORY_ID,
            name_ar: item.name_ar,
            name_en: item.name_en,
            description_ar: item.description_ar,
            description_en: item.description_en,
            price: item.price,
            image_url: imageUrl,
            is_available: true
        });

        if (pError) {
            console.error(`Error inserting product ${item.name_ar}:`, pError);
            continue;
        }
        console.log(`✅ Product ${item.name_ar} inserted.`);

        // Insert Options if any
        if (item.options) {
            for (const og of item.options) {
                const groupId = crypto.randomUUID();
                const { error: gError } = await supabase.from('option_groups').insert({
                    id: groupId,
                    product_id: item.id,
                    name_ar: og.group_name_ar,
                    name_en: og.group_name_en,
                    min_selection: 1,
                    max_selection: 1
                });

                if (gError) {
                    console.error(`Error inserting group ${og.group_name_ar}:`, gError);
                    continue;
                }

                for (const oi of og.items) {
                    const { error: iError } = await supabase.from('option_items').insert({
                        group_id: groupId,
                        name_ar: oi.name_ar,
                        name_en: oi.name_en,
                        price: oi.price,
                        is_available: true
                    });
                    if (iError) console.error(`Error inserting option ${oi.name_ar}:`, iError);
                }
                console.log(`✅ Options for ${item.name_ar} inserted.`);
            }
        }
    }
}

main();
