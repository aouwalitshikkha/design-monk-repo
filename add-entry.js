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
  const hours = await askNumber('Hours worked: ');

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

  // Build entry
  const entry = {
    id: date,
    date,
    hours,
    category,
    tasks,
    blockers: blockers || 'None',
    notes: notes || ''
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
      execSync('git add work-log.json', { stdio: 'inherit', cwd: __dirname });
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
