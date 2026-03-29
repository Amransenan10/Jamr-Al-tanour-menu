import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Starting additive insertion...");

  // Get Pizza category
  const { data: pizzaCats } = await supabase.from('categories').select('id').ilike('name_ar', '%بيتزا%');
  if (pizzaCats && pizzaCats.length > 0) {
    const pizzaCatId = pizzaCats[0].id;
    const { data: pizzas } = await supabase.from('products').select('id, name_ar').eq('category_id', pizzaCatId);
    
    if (pizzas) {
      for (const p of pizzas) {
        // Find existing Additives group or create new
        let { data: groups } = await supabase.from('option_groups').select('id').eq('product_id', p.id).ilike('name_ar', '%إضافات%');
        let groupId;
        if (!groups || groups.length === 0) {
          const { data: newGroup } = await supabase.from('option_groups').insert({
            product_id: p.id,
            name_ar: 'إضافات',
            name_en: 'Additions',
            min_selection: 0,
            max_selection: 10,
          }).select('id').single();
          groupId = newGroup.id;
        } else {
          groupId = groups[0].id;
        }

        // Insert Cheese Crust if not exists
        const { data: existingItems } = await supabase.from('option_items').select('id').eq('group_id', groupId).ilike('name_ar', '%أطراف جبن%');
        if (!existingItems || existingItems.length === 0) {
          await supabase.from('option_items').insert({
            group_id: groupId,
            name_ar: 'أطراف جبن',
            name_en: 'Cheese Crust',
            price: 0,
            price_rules: { "صغير": 3, "وسط": 4, "كبير": 5 }
          });
          console.log(`Added Cheese Crust to ${p.name_ar}`);
        }
      }
    }
  }

  // Get Shawarma category
  const { data: shawarmaCats } = await supabase.from('categories').select('id').ilike('name_ar', '%شاورما%');
  if (shawarmaCats && shawarmaCats.length > 0) {
    const shawarmaCatId = shawarmaCats[0].id;
    const { data: shawarmas } = await supabase.from('products').select('id, name_ar').eq('category_id', shawarmaCatId);
    
    if (shawarmas) {
      for (const p of shawarmas) {
        // Find existing Additives group or create new
        let { data: groups } = await supabase.from('option_groups').select('id').eq('product_id', p.id).ilike('name_ar', '%إضافات%');
        let groupId;
        if (!groups || groups.length === 0) {
          const { data: newGroup } = await supabase.from('option_groups').insert({
            product_id: p.id,
            name_ar: 'إضافات',
            name_en: 'Additions',
            min_selection: 0,
            max_selection: 10,
          }).select('id').single();
          groupId = newGroup.id;
        } else {
          groupId = groups[0].id;
        }

        // Insert Cheese if not exists
        const { data: existingItems } = await supabase.from('option_items').select('id').eq('group_id', groupId).ilike('name_ar', '%إضافة جبن%');
        if (!existingItems || existingItems.length === 0) {
          await supabase.from('option_items').insert({
            group_id: groupId,
            name_ar: 'إضافة جبن',
            name_en: 'Add Cheese',
            price: 0,
            price_rules: { "صغير": 1, "عادي": 1, "صاروخ": 2 }
          });
          console.log(`Added Extra Cheese to ${p.name_ar}`);
        }
      }
    }
  }

  console.log("Done.");
}
run();
