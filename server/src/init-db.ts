import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from './db.js';

async function initDatabase() {
  console.log('🚀 Initializing database...');
  
  try {
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Execute the schema
    const client = await pool.connect();
    try {
      await client.query(schema);
      console.log('✅ Database schema created successfully!');
      
      // Test the connection
      const categories = await client.query('SELECT COUNT(*) FROM categories');
      console.log(`📁 Categories in database: ${categories.rows[0].count}`);
      
      const authors = await client.query('SELECT COUNT(*) FROM authors');
      console.log(`👤 Authors in database: ${authors.rows[0].count}`);
      
    } finally {
      client.release();
    }
    
    await pool.end();
    console.log('🎉 Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
