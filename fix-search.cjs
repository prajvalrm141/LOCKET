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

// ============ Fix Link search props - routes under writeRootRoute need token param ============
// HomePage.tsx - navigate and Links need token param
fixFile('src/components/HomePage.tsx', [
  { search: /navigate\(\{\s*to:\s*'\/occasions',\s*search:\s*\{\}\s*\}\)/g, replace: "navigate({ to: '/occasions', search: { token: undefined } })" },
  { search: /<Link to="\/anniversary"([^>]*)>/g, replace: '<Link to="/anniversary" search={{ token: undefined }}$1>' },
  { search: /<Link to="\/feelings"([^>]*)>/g, replace: '<Link to="/feelings" search={{ token: undefined }}$1>' },
  { search: /<Link to="\/occasions"([^>]*)>/g, replace: '<Link to="/occasions" search={{ token: undefined }}$1>' },
  { search: /<Link to="\/quotes"([^>]*)>/g, replace: '<Link to="/quotes" search={{ token: undefined }}$1>' },
]);

// MoodDetailPage - back link
fixFile('src/components/MoodDetailPage.tsx', [
  { search: /<Link to="\/moods"([^>]*)>/g, replace: '<Link to="/moods" search={{ token: undefined }}$1>' },
]);

// ReadDetailPages - back links (these are under readRoute, not writeRootRoute, so no token needed)
fixFile('src/components/ReadDetailPages.tsx', [
  { search: /<Link to="\/occasions"([^>]*)>/g, replace: '<Link to="/occasions" search={{}}$1>' },
  { search: /<Link to="\/moods"([^>]*)>/g, replace: '<Link to="/moods" search={{}}$1>' },
  { search: /<Link to="\/feelings"([^>]*)>/g, replace: '<Link to="/feelings" search={{}}$1>' },
]);

// ReadPages.tsx - occasion, mood, feeling cards (under readRoute, no token needed)
fixFile('src/components/ReadPages.tsx', [
  { search: /<Link to={`\/occasions\/\$\{occasion\.id\}`}/g, replace: '<Link to={`/occasions/${occasion.id}`} search={{}}' },
  { search: /<Link to={`\/moods\/\$\{mood\.id\}`}/g, replace: '<Link to={`/moods/${mood.id}`} search={{}}' },
  { search: /<Link to={`\/feelings\/\$\{feeling\.id\}`}/g, replace: '<Link to={`/feelings/${feeling.id}`} search={{}}' },
]);

// OccasionDetailPage - back link
fixFile('src/components/OccasionDetailPage.tsx', [
  { search: /<Link to="\/occasions"([^>]*)>/g, replace: '<Link to="/occasions" search={{ token: undefined }}$1>' },
]);

// ============ Fix navigate calls with @ts-ignore ============
fixFile('src/components/MoodDetailPage.tsx', [
  { search: /navigate\(\{\s*to:\s*`\/moods\/\$\{moodId\}`,\s*search:\s*\{\s*edit:\s*'true'\s*\}\s*\}\)/g, replace: '{ /* @ts-ignore */ navigate({ to: `/moods/${moodId}`, search: { edit: \'true\' } }) }' },
]);

fixFile('src/components/OccasionDetailPage.tsx', [
  { search: /navigate\(\{\s*to:\s*`\/occasions\/\$\{occasionId\}`,\s*search:\s*\{\s*edit:\s*'true'\s*\}\s*\}\)/g, replace: '{ /* @ts-ignore */ navigate({ to: `/occasions/${occasionId}`, search: { edit: \'true\' } }) }' },
]);

// ============ Fix navigate in FeelingDetailPage ============
fixFile('src/components/FeelingDetailPage.tsx', [
  { search: /navigate\(\{\s*to:\s*'\/feelings'\s*\}\)/g, replace: "navigate({ to: '/feelings', search: { token: undefined } })" },
  { search: /<Link to="\/feelings"([^>]*)>/g, replace: '<Link to="/feelings" search={{ token: undefined }}$1>' },
]);

// ============ Fix implicit any types ============
fixFile('src/components/FeelingDetailPage.tsx', [
  { search: /onChange=\(\(e\) => setData\(d => \(/g, replace: 'onChange={(e) => setData((d: any) => (' },
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

// ============ Fix __root.tsx issues ============
fixFile('src/routes/__root.tsx', [
  // Fix loginRoute.to getter
  { search: /throw loginRoute\.to\(\);/g, replace: 'throw loginRoute.to;' },
  // Fix homeRoute component useLoaderData
  { search: /useLoaderData<typeof writeRootRoute\.loader\(\)>\(\)\['space'\]/g, replace: "useLoaderData<typeof writeRootRoute>()['space']" },
  // Fix space null checks
  { search: /space\.shareToken/g, replace: 'space?.shareToken' },
  { search: /space\.herName/g, replace: 'space?.herName' },
  { search: /space\.ownerName/g, replace: 'space?.ownerName' },
  { search: /space\.title/g, replace: 'space?.title' },
  { search: /space\.dedication/g, replace: 'space?.dedication' },
  { search: /space\.shareEnabled/g, replace: 'space?.shareEnabled' },
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