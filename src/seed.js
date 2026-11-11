import { seedAll } from './lib/storage.js';

console.log('🌱 Seeding University of Évora schedules & vector knowledge base...');
const count = await seedAll();
console.log(`✅ Indexed ${count} course documents into data/knowledge-base.json!`);
