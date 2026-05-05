const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const DATA_FILE = path.join(__dirname, 'work-log.json');

const CATEGORIES = [
  'Research',
  'Suggestion',
  'Consultation',
  'Development',
  'Design',
  'Meeting',
  'Documentation',
  'Learning',
  'Bug Fix',
  'Other'
];

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function askNumber(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      const num = parseFloat(answer.trim());
      resolve(isNaN(num) ? 0 : num);
    });
  });
}

function parseHours(input) {
  input = input.trim().toLowerCase().replace(/\s/g, '');

  // "1h30m" or "1h30min" -> 1.5
  const hmMatch = input.match(/^(\d+(?:\.\d+)?)h(?:(\d+)m?(?:in)?)?$/);
  if (hmMatch) {
    const h = parseFloat(hmMatch[1]);
    const m = hmMatch[2] ? parseInt(hmMatch[2], 10) : 0;
    return h + m / 60;
  }

  // "30m" or "30min" -> 0.5
  const minMatch = input.match(/^(\d+)m(?:in)?$/);
  if (minMatch) {
    return parseInt(minMatch[1], 10) / 60;
  }

  // "1:30" -> 1.5
  const timeMatch = input.match(/^(\d+):(\d+)$/);
  if (timeMatch) {
    return parseInt(timeMatch[1], 10) + parseInt(timeMatch[2], 10) / 60;
  }

  // "1.5" or ".5" or "1" -> decimal hours
  const num = parseFloat(input);
  if (!isNaN(num)) return num;

  return 0;
}

function askHours(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(parseHours(answer));
    });
  });
}

async function collectTasks() {
  const tasks = [];
  console.log('\nEnter tasks one by one (press Enter with empty task to finish):');
  while (true) {
    const task = await ask(`  Task ${tasks.length + 1}: `);
    if (!task) break;
    tasks.push(task);
  }
  return tasks;
}

function showCategories() {
  console.log('\nCategories:');
  CATEGORIES.forEach((cat, i) => {
    console.log(`  ${i + 1}. ${cat}`);
  });
}

async function main() {
  console.log('=== Design Monk Work Log ===\n');

  // Date
  const today = new Date().toISOString().split('T')[0];
  const dateInput = await ask(`Date [${today}]: `);
  const date = dateInput || today;

  // Hours
  const hours = await askHours('Hours worked (e.g., 1.5, 30m, 1h30m, 1:30): ');

  // Category
  showCategories();
  const catIndex = await askNumber('Select category (number): ');
  const category = CATEGORIES[catIndex - 1] || 'Other';

  // Tasks
  const tasks = await collectTasks();

  // Blockers
  const blockers = await ask('Any blockers? (press Enter if none): ');

  // Notes
  const notes = await ask('Additional notes: ');

  // Attachments
  const attachments = [];
  const attachDir = path.join(__dirname, 'attachments');
  if (!fs.existsSync(attachDir)) {
    fs.mkdirSync(attachDir, { recursive: true });
  }
  console.log('\nAttach note files one by one (press Enter with empty path to finish):');
  while (true) {
    const filePath = await ask(`  File ${attachments.length + 1}: `);
    if (!filePath) break;
    const resolved = path.resolve(filePath.trim());
    if (!fs.existsSync(resolved)) {
      console.log(`  Warning: File not found — "${resolved}"`);
      continue;
    }
    const ext = path.extname(resolved);
    const base = path.basename(resolved, ext);
    const destName = `${date}_${base}${ext}`;
    const destPath = path.join(attachDir, destName);
    fs.copyFileSync(resolved, destPath);
    attachments.push(`attachments/${destName}`);
    console.log(`  Copied to attachments/${destName}`);
  }

  // Build entry
  const entry = {
    id: date,
    date,
    hours,
    category,
    tasks,
    blockers: blockers || 'None',
    notes: notes || '',
    attachments: attachments.length ? attachments : undefined
  };

  // Read existing data
  let data = { entries: [] };
  if (fs.existsSync(DATA_FILE)) {
    try {
      data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
      console.log('Warning: Could not read existing file, starting fresh.');
    }
  }

  // Check if entry exists for this date
  const existingIndex = data.entries.findIndex(e => e.date === date);
  if (existingIndex !== -1) {
    const overwrite = await ask(`Entry already exists for ${date}. Overwrite? (y/n): `);
    if (overwrite.toLowerCase() === 'y') {
      data.entries[existingIndex] = entry;
      console.log(`Entry for ${date} updated.`);
    } else {
      console.log('Cancelled.');
      rl.close();
      return;
    }
  } else {
    data.entries.push(entry);
    console.log(`Entry for ${date} added.`);
  }

  // Sort by date
  data.entries.sort((a, b) => a.date.localeCompare(b.date));

  // Save file
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log('Saved to work-log.json');

  // Git operations
  try {
    const hasChanges = execSync('git status --porcelain', { encoding: 'utf8', cwd: __dirname }).trim();
    if (hasChanges) {
      execSync('git add work-log.json attachments/', { stdio: 'inherit', cwd: __dirname });
      execSync(`git commit -m "Update work log: ${date}"`, { stdio: 'inherit', cwd: __dirname });
      execSync('git push', { stdio: 'inherit', cwd: __dirname });
      console.log('\nPushed to GitHub successfully!');
    } else {
      console.log('\nNo changes to push.');
    }
  } catch (e) {
    console.log('\nNote: Git push failed or not a git repo yet.');
    console.log('Make sure you have initialized git and added remote.');
  }

  rl.close();
}

main().catch(err => {
  console.error('Error:', err.message);
  rl.close();
  process.exit(1);
});
