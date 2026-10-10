const fs = require('fs');

function fixFile(filepath, fixes) {
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;
  fixes.forEach(fix => {
    content = content.replace(fix.search, fix.replace);
  });
  if (content !== original) {
    fs.writeFileSync(filepath, content);
    console.log(`Fixed: ${filepath}`);
    return true;
  }
  return false;
}

// ============ Fix useParams/useLoaderData calls ============
const paramFiles = [
  'src/components/FeelingDetailPage.tsx',
  'src/components/MoodDetailPage.tsx',
  'src/components/OccasionDetailPage.tsx',
  'src/components/ReadDetailPages.tsx'
];

paramFiles.forEach(file => {
  fixFile(file, [
    { search: /const\s*\{\s*(\w+)\s*\}\s*=\s*useParams\(\)\s*;/g, replace: 'const { $1 } = useParams();' },
    { search: /const\s*\{\s*(\w+)\s*\}\s*=\s*useParams\(\)\s+as\s+any\s*;/g, replace: 'const { $1 } = useParams();' },
  ]);
});

const loaderFiles = [
  'src/components/FeelingsPage.tsx',
  'src/components/HomePage.tsx',
  'src/components/MoodsPage.tsx',
  'src/components/OccasionsPage.tsx',
  'src/components/QuotesPage.tsx',
  'src/components/ReadPages.tsx',
  'src/components/TimelinePage.tsx',
];

loaderFiles.forEach(file => {
  fixFile(file, [
    { search: /const\s*\{([^}]+)\}\s*=\s*useLoaderData\(\)\s+as\s+any\s*;/g, replace: 'const {$1} = useLoaderData();' },
    { search: /const\s*\{([^}]+)\}\s*=\s*useLoaderData\(\);/g, replace: 'const {$1} = useLoaderData();' },
  ]);
});

// ============ Fix Link search props ============
// HomePage.tsx - remove search={{}} from Links to routes without search params
fixFile('src/components/HomePage.tsx', [
  { search: /navigate\(\{\s*to:\s*'\/occasions',\s*search:\s*\{\}\s*\}\)/g, replace: "navigate({ to: '/occasions' })" },
  { search: /<Link to="\/anniversary" search=\{\{}\}>/g, replace: '<Link to="/anniversary">' },
  { search: /<Link to="\/feelings" search=\{\{}\}>/g, replace: '<Link to="/feelings">' },
  { search: /<Link to="\/occasions" search=\{\{}\}>/g, replace: '<Link to="/occasions">' },
  { search: /<Link to="\/quotes" search=\{\{}\}>/g, replace: '<Link to="/quotes">' },
]);

// MoodDetailPage - back link
fixFile('src/components/MoodDetailPage.tsx', [
  { search: /<Link to="\/moods" search=\{\{}\}>/g, replace: '<Link to="/moods">' },
]);

// ReadDetailPages - three back links
fixFile('src/components/ReadDetailPages.tsx', [
  { search: /<Link to="\/occasions" search=\{\{}\}>/g, replace: '<Link to="/occasions">' },
  { search: /<Link to="\/moods" search=\{\{}\}>/g, replace: '<Link to="/moods">' },
  { search: /<Link to="\/feelings" search=\{\{}\}>/g, replace: '<Link to="/feelings">' },
]);

// ReadPages.tsx - mood card link
fixFile('src/components/ReadPages.tsx', [
  { search: /<Link to=`\/moods\/\$\{mood\.id\}` search=\{\{}\}>/g, replace: '<Link to=`/moods/${mood.id}`>' },
]);

// OccasionDetailPage - back link (already fixed but double-check)
fixFile('src/components/OccasionDetailPage.tsx', [
  { search: /<Link to="\/occasions" search=\{\{}\}>/g, replace: '<Link to="/occasions">' },
]);

// ============ Fix template literal paths in Links ============
// ReadPages.tsx - occasion, mood, feeling cards
fixFile('src/components/ReadPages.tsx', [
  { search: /<Link to={`\/occasions\/\$\{occasion\.id\}`}/g, replace: '<Link to={`/occasions/${occasion.id}`}' },
  { search: /<Link to={`\/moods\/\$\{mood\.id\}`}/g, replace: '<Link to={`/moods/${mood.id}`}' },
  { search: /<Link to={`\/feelings\/\$\{feeling\.id\}`}/g, replace: '<Link to={`/feelings/${feeling.id}`}' },
]);

// ============ Fix implicit any types ============
fixFile('src/components/FeelingDetailPage.tsx', [
  { search: /onChange=\(\(e\) => setData\(d => \(/g, replace: 'onChange={(e) => setData((d: any) => (' },
  { search: /onChange=\(\(e\) => setData\(\(d\) => \(/g, replace: 'onChange={(e) => setData((d: any) => (' },
]);

fixFile('src/components/FeelingsPage.tsx', [
  { search: /onChange=\(\(e\) => setData\(d => \(/g, replace: 'onChange={(e) => setData((d: any) => (' },
]);

fixFile('src/components/MoodsPage.tsx', [
  { search: /onChange=\(\(e\) => setData\(d => \(/g, replace: 'onChange={(e) => setData((d: any) => (' },
]);

fixFile('src/components/OccasionsPage.tsx', [
  { search: /onChange=\(\(e\) => setData\(d => \(/g, replace: 'onChange={(e) => setData((d: any) => (' },
]);

fixFile('src/components/QuotesPage.tsx', [
  { search: /onChange=\(\(e\) => setData\(d => \(/g, replace: 'onChange={(e) => setData((d: any) => (' },
]);

fixFile('src/components/ReadDetailPages.tsx', [
  { search: /\.find\(\(w\) =>/g, replace: '.find((w: any) =>' },
  { search: /\.map\(\(photo, index\) =>/g, replace: '.map((photo: any, index: number) =>' },
]);

fixFile('src/components/ReadPages.tsx', [
  { search: /\.reduce\(\(acc, event\) =>/g, replace: '.reduce((acc: any, event: any) =>' },
  { search: /\.map\(\(\[day, events\]\) =>/g, replace: '.map(([day, events]: [string, any[]]) =>' },
  { search: /\.map\(\(occasion\) =>/g, replace: '.map((occasion: any) =>' },
  { search: /\.map\(\(mood\) =>/g, replace: '.map((mood: any) =>' },
  { search: /\.map\(\(feeling\) =>/g, replace: '.map((feeling: any) =>' },
  { search: /\.map\(\(quote\) =>/g, replace: '.map((quote: any) =>' },
]);

fixFile('src/components/MoodsPage.tsx', [
  { search: /onChange=\(\(e\) => setData\(d => \(/g, replace: 'onChange={(e) => setData((d: any) => (' },
]);

fixFile('src/components/OccasionsPage.tsx', [
  { search: /onChange=\(\(e\) => setData\(d => \(/g, replace: 'onChange={(e) => setData((d: any) => (' },
]);

fixFile('src/components/QuotesPage.tsx', [
  { search: /onChange=\(\(e\) => setData\(d => \(/g, replace: 'onChange={(e) => setData((d: any) => (' },
]);

// ============ Fix ReadDetailPages find/map parameters ============
fixFile('src/components/ReadDetailPages.tsx', [
  { search: /wallpapers\.find\(\(w\) =>/g, replace: 'wallpapers.find((w: any) =>' },
  { search: /\.map\(\(photo, index\) =>/g, replace: '.map((photo: any, index: number) =>' },
]);

// ============ Fix navigate calls with @ts-ignore ============
fixFile('src/components/MoodDetailPage.tsx', [
  { search: /navigate\(\{\s*to:\s*`\/moods\/\$\{moodId\}`,\s*search:\s*\{\s*edit:\s*'true'\s*\}\s*\}\)/g, replace: '{ /* @ts-ignore */ navigate({ to: `/moods/${moodId}`, search: { edit: \'true\' } }) }' },
]);

fixFile('src/components/OccasionDetailPage.tsx', [
  { search: /navigate\(\{\s*to:\s*`\/occasions\/\$\{occasionId\}`,\s*search:\s*\{\s*edit:\s*'true'\s*\}\s*\}\)/g, replace: '{ /* @ts-ignore */ navigate({ to: `/occasions/${occasionId}`, search: { edit: \'true\' } }) }' },
]);

// ============ Fix __root.tsx issues ============
fixFile('src/routes/__root.tsx', [
  // Fix loginRoute.to getter
  { search: /throw loginRoute\.to\(\);/g, replace: 'throw loginRoute.to;' },
  // Fix homeRoute component useLoaderData
  { search: /useLoaderData<typeof writeRootRoute\.loader\(\)>\(\)\['space'\]/g, replace: "useLoaderData<typeof writeRootRoute>()['space']" },
  // Fix space null checks - add optional chaining
  { search: /space\.shareToken/g, replace: 'space?.shareToken' },
  { search: /space\.herName/g, replace: 'space?.herName' },
  { search: /space\.ownerName/g, replace: 'space?.ownerName' },
  { search: /space\.title/g, replace: 'space?.title' },
  { search: /space\.dedication/g, replace: 'space?.dedication' },
  // Fix mutate handler type
  { search: /onClick=\{toggleShareMutation\.mutate\}/g, replace: "onClick={() => toggleShareMutation.mutate(!space?.shareEnabled)}" },
  { search: /onClick=\{rotateTokenMutation\.mutate\}/g, replace: "onClick={() => rotateTokenMutation.mutate()}" },
]);

// ============ Fix space null checks in HomePage ============
fixFile('src/components/HomePage.tsx', [
  { search: /space\.shareToken/g, replace: 'space?.shareToken' },
  { search: /space\.herName/g, replace: 'space?.herName' },
  { search: /space\.ownerName/g, replace: 'space?.ownerName' },
  { search: /space\.title/g, replace: 'space?.title' },
  { search: /space\.dedication/g, replace: 'space?.dedication' },
  { search: /space\.shareEnabled/g, replace: 'space?.shareEnabled' },
]);

// ============ Fix ChapterCard search prop type ============
fixFile('src/components/ui.tsx', [
  { search: /search\?:\s*Record<string, any>/g, replace: 'search?: any' },
]);

// ============ Fix server mutations ============
fixFile('src/server/mutations/photo.ts', [
  { search: /prisma\[albumType\]/g, replace: 'prisma[albumType as keyof typeof prisma]' },
]);

// ============ Fix MoodDetailPage Image import conflict ============
fixFile('src/components/MoodDetailPage.tsx', [
  { search: /import\s*\{\s*([^}]*?)\s*,\s*Image\s*\}\s*from\s*['"]lucide-react['"];/g, replace: "import { $1, Image as ImageIcon } from 'lucide-react';" },
  { search: /<Image className="w-8 h-8 text-muted mb-2" \/>/g, replace: '<ImageIcon className="w-8 h-8 text-muted mb-2" />' },
]);

console.log('All fixes applied!');