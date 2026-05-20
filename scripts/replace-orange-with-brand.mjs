import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src");

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(tsx|ts)$/.test(ent.name)) files.push(p);
  }
  return files;
}

/** Longer / more specific patterns first */
const pairs = [
  ["from-orange-500 to-orange-600", "from-brand to-brand/90"],
  ["from-orange-500/20 to-orange-600/10", "from-brand/20 to-brand/20"],
  ["bg-orange-500/30", "bg-brand/30"],
  ["bg-orange-500/20", "bg-brand/20"],
  ["bg-orange-500/15", "bg-brand/15"],
  ["bg-orange-500/10", "bg-brand/10"],
  ["bg-orange-500/5", "bg-brand/5"],
  ["border-orange-500/50", "border-brand/50"],
  ["border-orange-500/30", "border-brand/30"],
  ["border-t border-orange-500/30", "border-t border-brand/30"],
  ["ring-orange-500/50", "ring-brand/50"],
  ["ring-1 ring-orange-500/50", "ring-1 ring-brand/50"],
  ["focus:ring-orange-500/50", "focus:ring-brand/50"],
  ["hover:border-orange-500/50", "hover:border-brand/50"],
  ["hover:border-orange-500", "hover:border-brand"],
  ["focus:ring-orange-500", "focus:ring-brand"],
  ["focus:ring-2 focus:ring-orange-500", "focus:ring-2 focus:ring-brand"],
  ["border-b-2 border-orange-500", "border-b-2 border-brand"],
  ["text-orange-300", "text-brand/70"],
  ["text-orange-400", "text-brand/90"],
  ["text-orange-500", "text-brand"],
  ["hover:text-orange-400", "hover:text-brand/80"],
  ["hover:text-orange-300", "hover:text-brand/70"],
  ["hover:text-orange-500", "hover:text-brand"],
  ["group-hover:text-orange-500", "group-hover:text-brand"],
  ["fill-orange-500", "fill-brand"],
  ["from-orange-500/20", "from-brand/20"],
  ["from-orange-500/10", "from-brand/10"],
  ["from-orange-500/5", "from-brand/5"],
  ["to-orange-600/10", "to-brand/20"],
  ["to-orange-600", "to-brand/90"],
  ["to-orange-500/10", "to-brand/15"],
  ["from-orange-500 ", "from-brand "],
  ["from-orange-500,", "from-brand,"],
  ["stroke-orange-500", "stroke-brand"],
  ["disabled:bg-orange-500/50", "disabled:bg-brand/50"],
  ["hover:bg-orange-600", "hover:bg-brand/90"],
  ["hover:bg-orange-500", "hover:bg-brand/90"],
  ["bg-orange-500 text-white", "bg-brand text-brand-foreground"],
  ["bg-orange-500 rounded", "bg-brand rounded"],
  ["border-orange-500", "border-brand"],
  ["ring-orange-500", "ring-brand"],
  ["bg-orange-500", "bg-brand"],
  ["classList.add('border-orange-500')", "classList.add('border-brand')"],
  ["classList.remove('border-orange-500')", "classList.remove('border-brand')"],
];

let changed = 0;
for (const file of walk(root)) {
  let c = fs.readFileSync(file, "utf8");
  const orig = c;
  for (const [a, b] of pairs) {
    c = c.split(a).join(b);
  }
  if (c !== orig) {
    fs.writeFileSync(file, c);
    changed++;
  }
}
console.log("Updated files:", changed);
