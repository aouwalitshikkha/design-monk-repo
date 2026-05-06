const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const DATA_FILE = path.join(__dirname, 'work-log.json');
const TASKS_FILE = path.join(__dirname, 'tasks.json');

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

function readData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
      console.log('Warning: Could not read existing file.');
    }
  }
  return { entries: [] };
}

function saveData(data) {
  data.entries.sort((a, b) => a.date.localeCompare(b.date));
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function gitPush(date) {
  try {
    const hasChanges = execSync('git status --porcelain', { encoding: 'utf8', cwd: __dirname }).trim();
    if (hasChanges) {
      execSync('git add work-log.json attachments/', { stdio: 'inherit', cwd: __dirname });
      execSync(`git commit -m "Update work log: ${date}"`, { stdio: 'inherit', cwd: __dirname });
      execSync('git push', { stdio: 'inherit', cwd: __dirname });
      console.log('Pushed to GitHub successfully!');
    } else {
      console.log('No changes to push.');
    }
  } catch (e) {
    console.log('\nNote: Git push failed or not a git repo yet.');
  }
}

function displayEntry(entry) {
  console.log(`\n  Date:       ${entry.date}`);
  console.log(`  Hours:      ${entry.hours.toFixed(2)}`);
  console.log(`  Category:   ${entry.category}`);
  console.log(`  Tasks:      ${entry.tasks.map((t, i) => `${i + 1}. ${t}`).join('\n              ')}`);
  console.log(`  Blockers:   ${entry.blockers || 'None'}`);
  console.log(`  Notes:      ${entry.notes || ''}`);
  if (entry.attachments && entry.attachments.length) {
    console.log(`  Attachments: ${entry.attachments.join(', ')}`);
  }
}

async function editEntry() {
  console.log('=== Design Monk Work Log - Edit Mode ===\n');

  const data = readData();
  if (!data.entries.length) {
    console.log('No entries found.');
    rl.close();
    return;
  }

  console.log('Existing entries:');
  data.entries.forEach((e, i) => {
    const preview = e.tasks[0] ? e.tasks[0].substring(0, 55) : '';
    console.log(`  ${i + 1}. ${e.date}  ${e.category.padEnd(14)} ${String(e.hours.toFixed(2)).padStart(6)}h  ${preview}`);
  });

  const sel = await askNumber('\nSelect entry to edit (number): ');
  const idx = sel - 1;
  if (idx < 0 || idx >= data.entries.length) {
    console.log('Invalid selection.');
    rl.close();
    return;
  }

  const entry = data.entries[idx];
  console.log(`\n--- Current Entry for ${entry.date} ---`);
  displayEntry(entry);

  // Date
  const newDate = await ask(`Date [${entry.date}]: `) || entry.date;

  // Hours
  const hrsRaw = await ask(`Hours worked [${entry.hours.toFixed(2)}]: `);
  const newHours = hrsRaw.trim() ? parseHours(hrsRaw) : entry.hours;

  // Category
  showCategories();
  const catRaw = await ask(`Category [${entry.category}]: `);
  let newCategory = entry.category;
  if (catRaw.trim()) {
    const catNum = parseInt(catRaw.trim(), 10);
    if (!isNaN(catNum) && catNum >= 1 && catNum <= CATEGORIES.length) {
      newCategory = CATEGORIES[catNum - 1];
    } else {
      newCategory = catRaw.trim();
    }
  }

  // Tasks
  console.log('\nCurrent tasks:');
  entry.tasks.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  const keepTasks = await ask('Keep current tasks? (Y/n): ');
  let newTasks;
  if (keepTasks.toLowerCase() === 'n') {
    console.log('Enter new tasks (empty to finish):');
    newTasks = [];
    while (true) {
      const t = await ask(`  Task ${newTasks.length + 1}: `);
      if (!t) break;
      newTasks.push(t);
    }
  } else {
    newTasks = [...entry.tasks];
  }

  // Blockers
  const newBlockers = await ask(`Blockers [${entry.blockers || 'None'}]: `) || entry.blockers || 'None';

  // Notes
  const newNotes = await ask(`Notes [${entry.notes || ''}]: `) || entry.notes || '';

  // Attachments
  const attachDir = path.join(__dirname, 'attachments');
  if (!fs.existsSync(attachDir)) {
    fs.mkdirSync(attachDir, { recursive: true });
  }
  const existingAttachments = entry.attachments || [];
  if (existingAttachments.length) {
    console.log('\nCurrent attachments:');
    existingAttachments.forEach(a => console.log(`  - ${a}`));
  }
  console.log('\nAdd new attachments (press Enter to skip):');
  const newAttachments = [...existingAttachments];
  while (true) {
    const fp = await ask(`  File ${newAttachments.length + 1}: `);
    if (!fp) break;
    const resolved = path.resolve(fp.trim());
    if (!fs.existsSync(resolved)) {
      console.log(`  Warning: File not found — "${resolved}"`);
      continue;
    }
    const ext = path.extname(resolved);
    const base = path.basename(resolved, ext);
    const destName = `${newDate}_${base}${ext}`;
    fs.copyFileSync(resolved, path.join(attachDir, destName));
    newAttachments.push(`attachments/${destName}`);
    console.log(`  Copied to attachments/${destName}`);
  }

  // Build updated entry
  const updated = {
    id: `${newDate}_${Date.now()}`,
    date: newDate,
    hours: newHours,
    category: newCategory,
    tasks: newTasks,
    blockers: newBlockers || 'None',
    notes: newNotes || '',
    attachments: newAttachments.length ? newAttachments : undefined
  };

  data.entries.splice(idx, 1);
  data.entries.push(updated);
  saveData(data);
  console.log(`\nEntry for ${newDate} saved.`);
  gitPush(newDate);
  rl.close();
}

function readTasks() {
  if (fs.existsSync(TASKS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
    } catch (e) {
      console.log('Warning: Could not read tasks.json.');
    }
  }
  return { tasks: [] };
}

function saveTasks(data) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
}

function gitPushTasks(msg) {
  try {
    const hasChanges = execSync('git status --porcelain', { encoding: 'utf8', cwd: __dirname }).trim();
    if (hasChanges) {
      execSync('git add tasks.json', { stdio: 'inherit', cwd: __dirname });
      execSync(`git commit -m "${msg}"`, { stdio: 'inherit', cwd: __dirname });
      execSync('git push', { stdio: 'inherit', cwd: __dirname });
      console.log('Pushed to GitHub successfully!');
    }
  } catch (e) {
    console.log('\nNote: Git push failed or not a git repo yet.');
  }
}

async function manageTasks() {
  console.log('=== Design Monk Task Manager ===\n');

  while (true) {
    const data = readTasks();
    const pending = data.tasks.filter(t => t.status === 'pending');
    const completed = data.tasks.filter(t => t.status === 'completed');

    console.log('Pending:');
    if (!pending.length) {
      console.log('  (none)\n');
    } else {
      pending.forEach((t, i) => {
        const idx = data.tasks.indexOf(t) + 1;
        console.log(`  ${idx}. ${t.title}  (assigned: ${t.assignedDate})`);
      });
      console.log();
    }

    console.log('Completed:');
    if (!completed.length) {
      console.log('  (none)\n');
    } else {
      completed.forEach((t, i) => {
        const idx = data.tasks.indexOf(t) + 1;
        console.log(`  ${idx}. ${t.title}  (assigned: ${t.assignedDate}, done: ${t.completedDate})`);
      });
      console.log();
    }

    const cmd = await ask('(A)dd task, (C)omplete #, (q)uit: ');
    const lower = cmd.toLowerCase().trim();

    if (lower === 'q' || lower === 'quit') {
      break;
    }

    if (lower === 'a' || lower === 'add') {
      const title = await ask('Task title: ');
      if (!title) { console.log('Cancelled.\n'); continue; }
      const today = new Date().toISOString().split('T')[0];
      const date = await ask(`Assigned date [${today}]: `) || today;
      const nextId = data.tasks.length ? Math.max(...data.tasks.map(t => parseInt(t.id, 10))) + 1 : 1;
      data.tasks.push({
        id: String(nextId),
        title,
        assignedDate: date,
        completedDate: null,
        status: 'pending'
      });
      saveTasks(data);
      console.log(`Task added: "${title}"\n`);
      gitPushTasks(`Add task: ${title}`);
      continue;
    }

    if (lower.startsWith('c')) {
      const parts = lower.split(/\s+/);
      let num;
      if (parts.length > 1) {
        num = parseInt(parts[1], 10);
      } else {
        const raw = await ask('Task number to complete: ');
        num = parseInt(raw.trim(), 10);
      }

      if (isNaN(num) || num < 1 || num > data.tasks.length) {
        console.log('Invalid number.\n');
        continue;
      }

      const task = data.tasks[num - 1];
      if (task.status === 'completed') {
        console.log(`Task "${task.title}" is already completed.\n`);
        continue;
      }

      const today = new Date().toISOString().split('T')[0];
      const doneDate = await ask(`Completed date [${today}]: `) || today;
      task.completedDate = doneDate;
      task.status = 'completed';
      saveTasks(data);
      console.log(`Task completed: "${task.title}"\n`);
      gitPushTasks(`Complete task: ${task.title}`);
      continue;
    }

    console.log('Unknown command.\n');
  }

  console.log('Goodbye!');
  rl.close();
}

async function main() {
  if (process.argv.includes('--edit')) {
    await editEntry();
    return;
  }

  if (process.argv.includes('--tasks')) {
    await manageTasks();
    return;
  }

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
    id: `${date}_${Date.now()}`,
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

  saveData(data);
  console.log('Saved to work-log.json');
  gitPush(date);
  rl.close();
}

main().catch(err => {
  console.error('Error:', err.message);
  rl.close();
  process.exit(1);
});
