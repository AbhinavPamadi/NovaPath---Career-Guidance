#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables for NovaPath Career Guidance...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
const envExamplePath = path.join(__dirname, 'env.example');

if (fs.existsSync(envPath)) {
  console.log('✅ .env.local already exists');
  
  // Check if NEXT_PUBLIC_NEWS_API_KEY is set
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('NEXT_PUBLIC_NEWS_API_KEY')) {
    console.log('✅ NEXT_PUBLIC_NEWS_API_KEY is already configured');
  } else {
    console.log('⚠️  NEXT_PUBLIC_NEWS_API_KEY is missing from .env.local');
    console.log('   Please add: NEXT_PUBLIC_NEWS_API_KEY=your_news_api_key_here');
  }
} else {
  console.log('📝 Creating .env.local from env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, exampleContent);
    console.log('✅ .env.local created successfully');
    console.log('⚠️  Please update the values in .env.local with your actual API keys');
  } else {
    console.log('❌ env.example not found');
  }
}

console.log('\n📋 Required environment variables:');
console.log('   NEXT_PUBLIC_NEWS_API_KEY=your_news_api_key_here');
console.log('   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key');
console.log('   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com');
console.log('   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id');
console.log('   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com');
console.log('   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id');
console.log('   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id');
console.log('   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id');

console.log('\n🚀 To deploy:');
console.log('   npm run deploy');
console.log('\n📖 For more details, see DEPLOYMENT.md');
