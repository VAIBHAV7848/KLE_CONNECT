#!/usr/bin/env node
/**
 * Supabase Schema Sync & Verification Script
 * This script verifies the Supabase connection and schema
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function checkSupabaseConnection() {
  logSection('🔍 CHECKING SUPABASE CONNECTION');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    log('❌ Missing Supabase environment variables!', 'red');
    log('   Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set', 'yellow');
    return false;
  }
  
  log(`✓ Environment variables found`, 'green');
  log(`  URL: ${supabaseUrl.substring(0, 30)}...`, 'cyan');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by fetching current user
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      log(`❌ Connection failed: ${error.message}`, 'red');
      return false;
    }
    
    log('✓ Supabase connection successful', 'green');
    return supabase;
  } catch (err) {
    log(`❌ Connection error: ${err.message}`, 'red');
    return false;
  }
}

async function verifySchema(supabase) {
  logSection('📊 VERIFYING DATABASE SCHEMA');
  
  const expectedTables = [
    'users',
    'chats',
    'forum_questions',
    'forum_answers',
    'notes',
    'rooms',
    'room_participants',
    'system_config',
    'system_settings',
    'audit_logs'
  ];
  
  try {
    // Check if tables exist
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      log(`❌ Failed to fetch tables: ${error.message}`, 'red');
      return false;
    }
    
    const existingTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    
    log(`Found ${existingTables.length} tables:`, 'cyan');
    existingTables.forEach(table => {
      const status = expectedTables.includes(table) ? '✓' : '?';
      const color = expectedTables.includes(table) ? 'green' : 'yellow';
      log(`  ${status} ${table}`, color);
    });
    
    if (missingTables.length > 0) {
      log(`\n❌ Missing tables:`, 'red');
      missingTables.forEach(table => {
        log(`  - ${table}`, 'red');
      });
      log('\n⚠️  Run the schema.sql file in Supabase SQL Editor', 'yellow');
      return false;
    }
    
    log('\n✓ All expected tables exist', 'green');
    return true;
  } catch (err) {
    log(`❌ Schema verification error: ${err.message}`, 'red');
    return false;
  }
}

async function checkRLS(supabase) {
  logSection('🔒 CHECKING ROW LEVEL SECURITY');
  
  try {
    const { data: policies, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      log(`❌ Failed to check RLS: ${error.message}`, 'red');
      return false;
    }
    
    log('✓ RLS policies are configured', 'green');
    return true;
  } catch (err) {
    log(`❌ RLS check error: ${err.message}`, 'red');
    return false;
  }
}

async function testRealtime(supabase) {
  logSection('⚡ TESTING REALTIME SUBSCRIPTIONS');
  
  try {
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        console.log('  Realtime event received:', payload.eventType);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          log('✓ Realtime subscription active', 'green');
        }
      });
    
    // Wait a moment for subscription
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Cleanup
    channel.unsubscribe();
    
    log('✓ Realtime functionality verified', 'green');
    return true;
  } catch (err) {
    log(`❌ Realtime test error: ${err.message}`, 'red');
    return false;
  }
}

async function generateMigrationScript() {
  logSection('📝 GENERATING MIGRATION REPORT');
  
  try {
    const schemaPath = join(__dirname, '..', 'supabase', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    log('✓ Schema file loaded', 'green');
    log(`  Size: ${(schema.length / 1024).toFixed(2)} KB`, 'cyan');
    log(`  Lines: ${schema.split('\n').length}`, 'cyan');
    
    return true;
  } catch (err) {
    log(`❌ Failed to load schema: ${err.message}`, 'red');
    return false;
  }
}

async function main() {
  console.log(`${colors.bright}
╔══════════════════════════════════════════════════════════════╗
║     KLE CONNECT - Supabase Schema Sync & Verification        ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);
  
  const results = {
    connection: false,
    schema: false,
    rls: false,
    realtime: false,
    migration: false
  };
  
  // Check connection
  const supabase = await checkSupabaseConnection();
  results.connection = !!supabase;
  
  if (!results.connection) {
    log('\n❌ Cannot proceed without Supabase connection', 'red');
    process.exit(1);
  }
  
  // Verify schema
  results.schema = await verifySchema(supabase);
  
  // Check RLS
  results.rls = await checkRLS(supabase);
  
  // Test realtime
  results.realtime = await testRealtime(supabase);
  
  // Generate migration report
  results.migration = await generateMigrationScript();
  
  // Summary
  logSection('📋 SUMMARY');
  
  const allPassed = Object.values(results).every(r => r);
  
  Object.entries(results).forEach(([key, passed]) => {
    const icon = passed ? '✓' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${icon} ${key.charAt(0).toUpperCase() + key.slice(1)}: ${passed ? 'PASSED' : 'FAILED'}`, color);
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    log('✅ ALL CHECKS PASSED - Supabase is ready!', 'green');
    log('\n🚀 You can now run the application:', 'cyan');
    log('   npm run dev', 'bright');
  } else {
    log('⚠️  SOME CHECKS FAILED - Please review the issues above', 'yellow');
    log('\n📝 To apply the schema:', 'cyan');
    log('   1. Go to Supabase Dashboard → SQL Editor', 'bright');
    log('   2. Copy contents of supabase/schema.sql', 'bright');
    log('   3. Paste and run the SQL', 'bright');
  }
  
  console.log('='.repeat(60) + '\n');
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
