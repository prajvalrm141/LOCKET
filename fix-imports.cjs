const fs = require('fs');
const files = [
  'src/components/OccasionDetailPage.tsx',
  'src/components/MoodsPage.tsx',
  'src/components/MoodDetailPage.tsx',
  'src/components/FeelingsPage.tsx',
  'src/components/FeelingDetailPage.tsx',
  'src/components/QuotesPage.tsx',
  'src/components/ReadDetailPages.tsx',
  'src/components/ReadPages.tsx',
  'src/components/TimelinePage.tsx',
  'src/components/HomePage.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Fix useLoaderData calls
  content = content.replace(/useLoaderData<typeof router\.routes\.\w+Route\(\)>/g, 'useLoaderData() as any');
  content = content.replace(/useLoaderData<typeof router\.routes\.homeRoute\(\)>/g, 'useLoaderData() as any');
  // Remove router import
  content = content.replace(/import \{ router \} from '@\/routes\/__root';?\n?/g, '');
  content = content.replace(/import \{ router \} from '@\/routes\/__root'\n/g, '');
  // Fix duplicate useState
  content = content.replace(/import \{ useState \} from 'react';\nimport \{ useState \} from 'react';/g, "import { useState } from 'react';");
  fs.writeFileSync(file, content);
});
console.log('Done');